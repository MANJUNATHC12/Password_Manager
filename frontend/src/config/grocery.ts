// ─── Grocery categories ───────────────────────────────────────

export const GROCERY_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy & Eggs',
  'Grains & Pulses',
  'Meat & Seafood',
  'Beverages',
  'Snacks & Bakery',
  'Household',
  'Personal Care',
  'Other',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

// ─── Units ───────────────────────────────────────────────────

export const GROCERY_UNITS = [
  'pcs',
  'kg',
  'g',
  'L',
  'mL',
  'pack',
  'dozen',
  'bottle',
  'bag',
  'box',
] as const

// ─── Category icons (emoji) ───────────────────────────────────

export const CATEGORY_EMOJI: Record<string, string> = {
  'Vegetables': '🥦',
  'Fruits': '🍎',
  'Dairy & Eggs': '🥛',
  'Grains & Pulses': '🌾',
  'Meat & Seafood': '🥩',
  'Beverages': '🧃',
  'Snacks & Bakery': '🍞',
  'Household': '🏠',
  'Personal Care': '🧴',
  'Other': '🛒',
}

// ─── Category colours ─────────────────────────────────────────

const CATEGORY_PALETTE: Record<string, string> = {
  'Vegetables': '#22c55e',
  'Fruits': '#f97316',
  'Dairy & Eggs': '#facc15',
  'Grains & Pulses': '#a78bfa',
  'Meat & Seafood': '#f43f5e',
  'Beverages': '#38bdf8',
  'Snacks & Bakery': '#fb923c',
  'Household': '#94a3b8',
  'Personal Care': '#e879f9',
  'Other': '#64748b',
}

export function groceryCategoryColor(cat: string): string {
  return CATEGORY_PALETTE[cat] ?? '#64748b'
}

// ─── Helpers ─────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  return (
    '₹' +
    n.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return month
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function monthOptions(count = 12): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ value, label: formatMonthLabel(value) })
  }
  return opts
}
