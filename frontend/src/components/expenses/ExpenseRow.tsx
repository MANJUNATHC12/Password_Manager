import { Pencil, Trash2, Calendar, AlertTriangle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/config/expenses'
import { cn } from '@/utils/cn'
import type { Expense } from '@/types'

interface Props {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}

function getExpiryStatus(expiryDateStr: string) {
  const [y, m, d] = expiryDateStr.split('-').map(Number)
  const exp = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      label: `Expired ${Math.abs(diffDays)}d ago`,
      isExpired: true,
      isNear: false,
    }
  }
  if (diffDays === 0) {
    return { label: 'Expires today!', isExpired: true, isNear: true }
  }
  if (diffDays <= 5) {
    return {
      label: `Expires in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      isExpired: false,
      isNear: true,
    }
  }
  return {
    label: `Valid till ${formatDate(expiryDateStr)}`,
    isExpired: false,
    isNear: false,
  }
}

export function ExpenseRow({ expense, onEdit, onDelete }: Props) {
  const expiryStatus = expense.expiry_date ? getExpiryStatus(expense.expiry_date) : null

  return (
    <div className={cn(
      "flex items-center gap-4 rounded-xl border p-4 shadow-sm transition hover:shadow-md",
      expiryStatus?.isExpired
        ? "border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/10"
        : expiryStatus?.isNear
          ? "border-amber-200 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-slate-900 dark:text-white">
            {expense.description || expense.category}
          </span>
          <Badge>{expense.category}</Badge>

          {/* Expiry / Last Date Tag */}
          {expiryStatus && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                expiryStatus.isExpired
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  : expiryStatus.isNear
                    ? 'bg-amber-100 text-amber-800 animate-pulse dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
              )}
            >
              {expiryStatus.isExpired ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {expiryStatus.label}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Spent: {formatDate(expense.spent_on)}</span>
          {expense.expiry_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              Last date: {formatDate(expense.expiry_date)}
            </span>
          )}
          {expense.payment_method && <span>· {expense.payment_method}</span>}
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          aria-label="Edit expense"
          className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete expense"
          className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
