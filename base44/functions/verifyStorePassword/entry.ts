import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Rate limiter: { ip -> { count, resetAt } }
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (record.count >= MAX_ATTEMPTS) return true;
  record.count += 1;
  return false;
}

function getClientIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SHA256_REGEX = /^[a-f0-9]{64}$/;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many attempts. Please wait before trying again.' }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { storeName, password } = body;

  if (!storeName || typeof storeName !== 'string' || storeName.trim().length === 0) {
    return Response.json({ success: false, error: 'اسم البقالة مطلوب' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 1) {
    return Response.json({ success: false, error: 'كلمة المرور مطلوبة' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Fetch store using service role — never expose to frontend
  let stores = await base44.asServiceRole.entities.Store.filter({ name: storeName.trim() });
  if (stores.length === 0) {
    stores = await base44.asServiceRole.entities.Store.filter({ owner_email: storeName.trim() });
  }

  // Generic error — do not reveal whether store exists
  if (stores.length === 0) {
    return Response.json({ success: false, error: 'البيانات غير صحيحة' });
  }

  const store = stores[0];

  if (!store.is_approved) {
    return Response.json({ success: false, error: 'البقالة قيد المراجعة، سيتم التواصل معك قريباً' });
  }

  const storedPassword = store.password || '';

  // Reject any record not yet using SHA-256 hashed storage
  if (!SHA256_REGEX.test(storedPassword)) {
    return Response.json({ success: false, error: 'كلمة المرور يجب إعادة ضبطها من الإدارة' });
  }

  const inputHash = await sha256(password);

  if (storedPassword !== inputHash) {
    return Response.json({ success: false, error: 'البيانات غير صحيحة' });
  }

  // Success — reset rate limit, return store WITHOUT password
  attempts.delete(ip);
  const { password: _pw, ...safeStore } = store;
  return Response.json({ success: true, store: safeStore });
});