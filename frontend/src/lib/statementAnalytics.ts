import type { DraftExpense } from './statementParser'

export interface CategoryTotal {
  category: string
  total: number
  count: number
}

export interface TimePoint {
  /** ISO label: YYYY-MM-DD (daily) or YYYY-MM (monthly) */
  label: string
  /** human readable label for axis/legend */
  display: string
  total: number
  count: number
}

export interface TopTransaction {
  key: number
  description: string
  amount: number
  category: string
  spent_on: string
}

export interface StatementAnalytics {
  totalExpense: number
  totalIncome: number
  net: number
  txnCount: number
  debitCount: number
  creditCount: number
  dateFrom: string | null
  dateTo: string | null
  byCategory: CategoryTotal[]
  overTime: TimePoint[]
  isMonthly: boolean
  topTransactions: TopTransaction[]
}

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  if (!y || !m) return iso
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
  })
}

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'short',
  })}`
}

/**
 * Compute everything the report needs from parsed statement rows.
 * `isDebit` rows are treated as expenses; the rest as income.
 */
export function analyzeStatement(rows: DraftExpense[]): StatementAnalytics {
  let totalExpense = 0
  let totalIncome = 0
  let debitCount = 0
  let creditCount = 0

  const catMap = new Map<string, CategoryTotal>()
  const dayMap = new Map<string, TimePoint>()
  const monthMap = new Map<string, TimePoint>()
  const dates: string[] = []

  const top: TopTransaction[] = []

  for (const r of rows) {
    const amount = Number(r.amount) || 0
    if (amount <= 0) continue

    if (r.isDebit) {
      totalExpense += amount
      debitCount++
      const cat =
        catMap.get(r.category) ?? { category: r.category, total: 0, count: 0 }
      cat.total += amount
      cat.count += 1
      catMap.set(r.category, cat)
    } else {
      totalIncome += amount
      creditCount++
    }

    if (r.spent_on) {
      dates.push(r.spent_on)
      // daily bucket
      const d = dayMap.get(r.spent_on) ?? {
        label: r.spent_on,
        display: dayLabel(r.spent_on),
        total: 0,
        count: 0,
      }
      d.total += amount
      d.count += 1
      dayMap.set(r.spent_on, d)
      // monthly bucket
      const ym = r.spent_on.slice(0, 7)
      const m = monthMap.get(ym) ?? {
        label: ym,
        display: monthLabel(ym),
        total: 0,
        count: 0,
      }
      m.total += amount
      m.count += 1
      monthMap.set(ym, m)
    }

    top.push({
      key: r.key,
      description: r.description,
      amount,
      category: r.category,
      spent_on: r.spent_on,
    })
  }

  const byCategory = Array.from(catMap.values()).sort(
    (a, b) => b.total - a.total,
  )

  // Decide daily vs monthly grouping: if the span is > ~40 days or crosses
  // multiple months, aggregate by month.
  const sortedDates = dates.slice().sort()
  let isMonthly = false
  if (sortedDates.length > 1) {
    const first = new Date(sortedDates[0])
    const last = new Date(sortedDates[sortedDates.length - 1])
    const spanDays =
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)
    isMonthly = spanDays > 40 || monthMap.size > 1
  }

  const overTime = (isMonthly ? Array.from(monthMap.values()) : Array.from(dayMap.values()))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((p) => ({
      ...p,
      display: isMonthly ? monthLabel(p.label) : dayLabel(p.label),
    }))

  const topTransactions = top
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  return {
    totalExpense,
    totalIncome,
    net: totalIncome - totalExpense,
    txnCount: rows.length,
    debitCount,
    creditCount,
    dateFrom: sortedDates[0] ?? null,
    dateTo: sortedDates[sortedDates.length - 1] ?? null,
    byCategory,
    overTime,
    isMonthly,
    topTransactions,
  }
}
