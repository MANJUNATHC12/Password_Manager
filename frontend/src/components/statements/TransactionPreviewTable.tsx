import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { EXPENSE_CATEGORIES, formatCurrency, formatDate } from '@/config/expenses'
import type { DraftExpense } from '@/lib/statementParser'

export interface PreviewRow extends DraftExpense {
  include: boolean
}

interface Props {
  rows: PreviewRow[]
  onToggle: (key: number, include: boolean) => void
  onToggleAll: (include: boolean) => void
  onCategoryChange: (key: number, category: string) => void
}

const selectClass =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200'

export function TransactionPreviewTable({
  rows,
  onToggle,
  onToggleAll,
  onCategoryChange,
}: Props) {
  const allSelected = rows.length > 0 && rows.every((r) => r.include)
  const someSelected = rows.some((r) => r.include)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected
                }}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                aria-label="Select all"
              />
            </th>
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5">Description</th>
            <th className="px-3 py-2.5">Type</th>
            <th className="px-3 py-2.5">Category</th>
            <th className="px-3 py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r.key}
              className={r.include ? 'bg-white' : 'bg-slate-50/60 text-slate-400'}
            >
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={r.include}
                  onChange={(e) => onToggle(r.key, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Include transaction"
                />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                {r.spent_on ? formatDate(r.spent_on) : '—'}
              </td>
              <td className="max-w-[240px] px-3 py-2">
                <span className="block truncate" title={r.description}>
                  {r.description || '—'}
                </span>
              </td>
              <td className="px-3 py-2">
                {r.isDebit ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                    <ArrowUpCircle className="h-3.5 w-3.5" /> Debit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <ArrowDownCircle className="h-3.5 w-3.5" /> Credit
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <select
                  value={r.category}
                  onChange={(e) => onCategoryChange(r.key, e.target.value)}
                  className={selectClass}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                  r.isDebit ? 'text-slate-900' : 'text-emerald-600'
                }`}
              >
                {r.isDebit ? '' : '+'}
                {formatCurrency(Number(r.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
