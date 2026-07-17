import { Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/config/expenses'
import type { Expense } from '@/types'

interface Props {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}

export function ExpenseRow({ expense, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900">
            {expense.description || expense.category}
          </span>
          <Badge>{expense.category}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{formatDate(expense.spent_on)}</span>
          {expense.payment_method && <span>· {expense.payment_method}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-slate-900">
          {formatCurrency(expense.amount)}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          aria-label="Edit expense"
          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete expense"
          className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
