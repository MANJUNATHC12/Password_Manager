import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { ExpenseRow } from '@/components/expenses/ExpenseRow'
import { ExpenseFormModal } from '@/components/expenses/ExpenseForm'
import {
  listExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/services/expenses'
import { getErrorMessage } from '@/utils/error'
import {
  EXPENSE_CATEGORIES,
  categoryColor,
  currentMonth,
  formatCurrency,
  formatMonthLabel,
} from '@/config/expenses'
import type { Expense, ExpenseForm, ExpenseSummary } from '@/types'

const PAGE_SIZE = 20

function monthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    opts.push({ value, label: formatMonthLabel(value) })
  }
  return opts
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(currentMonth())
  const [category, setCategory] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)
  const reload = () => setReloadToken((t) => t + 1)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, summaryRes] = await Promise.all([
        listExpenses({
          page,
          page_size: PAGE_SIZE,
          month,
          category: category || null,
        }),
        getExpenseSummary(month),
      ])
      let rows = listRes.entries
      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter(
          (e) =>
            (e.description ?? '').toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q),
        )
      }
      setExpenses(rows)
      setTotal(listRes.total)
      setTotalAmount(listRes.total_amount)
      setTotalPages(listRes.total_pages)
      setSummary(summaryRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, month, category, search, reloadToken])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [month, category, search])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (expense: Expense) => {
    setEditing(expense)
    setFormOpen(true)
  }

  const handleSubmit = async (form: ExpenseForm) => {
    setSubmitting(true)
    try {
      if (editing) await updateExpense(editing.id, form)
      else await createExpense(form)
      setFormOpen(false)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteExpense(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)
  const maxCat = summary?.by_category[0]?.total ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500">
            Track and review your monthly spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/statements">
            <Button variant="secondary">
              <Upload className="h-4 w-4" />
              Import statement
            </Button>
          </Link>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        >
          {monthOptions().map((o) => (
            <option value={o.value} key={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{formatMonthLabel(month)}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total this month</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(summary?.total ?? totalAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary?.count ?? total}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Daily average</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(
              summary && summary.count > 0
                ? summary.total / new Date().getDate()
                : 0,
            )}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {summary && summary.by_category.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Spend by category
          </p>
          <div className="space-y-2.5">
            {summary.by_category.map((c) => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-slate-600">
                  {c.category}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxCat > 0 ? (c.total / maxCat) * 100 : 0}%`,
                      backgroundColor: categoryColor(c.category),
                    }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-sm font-medium text-slate-900">
                  {formatCurrency(c.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by description or category..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:w-48"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option value={c} key={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-primary-600" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Plus className="h-6 w-6" />
          </div>
          <p className="font-medium text-slate-700">No expenses yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || category
              ? 'Try adjusting your search or filter.'
              : 'Add your first expense for this month.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onEdit={() => openEdit(expense)}
              onDelete={() => setDeleteTarget(expense)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing {start}–{end} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ExpenseFormModal
        open={formOpen}
        expense={editing}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete expense"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this expense (
          <span className="font-semibold text-slate-900">
            {deleteTarget ? formatCurrency(deleteTarget.amount) : ''}
          </span>
          )? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
