/** Unified grocery categories (aligned with Catalog admin) */
export const GROCERY_CATEGORIES = [
  { key: 'all', label: 'الكل', emoji: '🛒' },
  { key: 'خضروات', label: 'خضروات', emoji: '🥬' },
  { key: 'مياه ومشروبات', label: 'مياه ومشروبات', emoji: '💧' },
  { key: 'ألبان ومنتجات', label: 'ألبان', emoji: '🥛' },
  { key: 'مخبوزات', label: 'مخبوزات', emoji: '🍞' },
  { key: 'سناكس وشوكولاتة', label: 'سناكس', emoji: '🍫' },
  { key: 'أرز وأساسيات', label: 'أساسيات', emoji: '🌾' },
  { key: 'أطعمة جاهزة', label: 'جاهزة', emoji: '🍜' },
  { key: 'منتجات مجمدة', label: 'مجمدات', emoji: '🧊' },
  { key: 'منظفات', label: 'منظفات', emoji: '🧹' },
  { key: 'عناية شخصية', label: 'عناية', emoji: '🧴' },
  { key: 'منتجات الأطفال', label: 'الأطفال', emoji: '👶' },
];

export const CATEGORY_EMOJI = Object.fromEntries(
  GROCERY_CATEGORIES.filter((c) => c.key !== 'all').map((c) => [c.key, c.emoji])
);
