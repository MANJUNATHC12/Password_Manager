import { formatCurrency, categoryColor, formatDate } from '@/config/expenses'
import type { TopTransaction } from '@/lib/statementAnalytics'

interface Props {
  items: TopTransaction[]
  emptyText?: string
}

export function TopTransactions({ items, emptyText = 'No transactions' }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-sm text-slate-400">
        {emptyText}
      </div>
    )
  }
  const max = Math.max(...items.map((i) => i.amount))

  return (
    <div className="space-y-2.5">
      {items.map((t) => (
        <div key={t.key} className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-slate-700" title={t.description}>
                {t.description || 'Transaction'}
              </span>
              <span className="shrink-0 text-sm font-semibold text-slate-900">
                {formatCurrency(t.amount)}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${max > 0 ? (t.amount / max) * 100 : 0}%`,
                  backgroundColor: categoryColor(t.category),
                }}
              />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span>{t.category}</span>
              {t.spent_on && <span>· {formatDate(t.spent_on)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
