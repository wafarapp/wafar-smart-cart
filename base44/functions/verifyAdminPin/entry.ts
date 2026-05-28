import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory rate limiter: { ip -> { count, resetAt } }
const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return true;
  }

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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return Response.json(
      { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
      { status: 429 }
    );
  }

  // Require authenticated admin session
  const base44 = createClientFromRequest(req);
  let user;
  try {
    user = await base44.auth.me();
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { pin } = body;

  // Validate input
  if (!pin || typeof pin !== 'string' || pin.length < 1 || pin.length > 20) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  const adminPin = Deno.env.get('VITE_ADMIN_PIN');
  if (!adminPin) {
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Constant-time comparison to prevent timing attacks
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin.padEnd(32));
  const adminBytes = encoder.encode(adminPin.padEnd(32));

  let diff = 0;
  for (let i = 0; i < 32; i++) {
    diff |= pinBytes[i] ^ adminBytes[i];
  }

  const isValid = diff === 0 && pin.length === adminPin.length;

  if (isValid) {
    // Reset attempts on success
    attempts.delete(ip);
    return Response.json({ success: true });
  }

  return Response.json({ success: false }, { status: 401 });
});