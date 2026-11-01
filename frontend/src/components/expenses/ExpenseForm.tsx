import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, today } from '@/config/expenses'
import type { Expense, ExpenseForm } from '@/types'

interface Props {
  open: boolean
  expense: Expense | null
  submitting: boolean
  onClose: () => void
  onSubmit: (form: ExpenseForm) => Promise<void>
}

const emptyForm = (): ExpenseForm => ({
  amount: '',
  category: 'Bills & Utilities',
  description: '',
  payment_method: 'UPI',
  spent_on: today(),
  expiry_date: '',
})

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

function calculateFutureDate(
  baseDateStr: string,
  days?: number,
  months?: number,
  years?: number,
): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date()
  if (Number.isNaN(base.getTime())) return ''

  const result = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  if (years) result.setFullYear(result.getFullYear() + years)
  if (months) result.setMonth(result.getMonth() + months)
  if (days) result.setDate(result.getDate() + days)

  const y = result.getFullYear()
  const m = String(result.getMonth() + 1).padStart(2, '0')
  const d = String(result.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function ExpenseFormModal({
  open,
  expense,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<ExpenseForm>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (expense) {
      setForm({
        amount: String(expense.amount),
        category: expense.category,
        description: expense.description ?? '',
        payment_method: expense.payment_method ?? '',
        spent_on: expense.spent_on,
        expiry_date: expense.expiry_date ?? '',
      })
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [open, expense])

  const set =
    (key: keyof ExpenseForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const applyDuration = (days?: number, months?: number, years?: number) => {
    const base = form.spent_on || today()
    const target = calculateFutureDate(base, days, months, years)
    setForm((f) => ({ ...f, expiry_date: target }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const amount = Number(form.amount)
    if (!form.amount || Number.isNaN(amount) || amount <= 0)
      next.amount = 'Enter an amount greater than 0.'
    if (!form.spent_on) next.spent_on = 'Pick a date.'
    if (!form.category) next.category = 'Select a category.'
    if (form.expiry_date && form.spent_on && form.expiry_date < form.spent_on) {
      next.expiry_date = 'Last date cannot be earlier than spent date.'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    await onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Edit expense' : 'Add expense'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" loading={submitting}>
            {expense ? 'Save changes' : 'Add expense'}
          </Button>
        </>
      }
    >
      <form
        id="expense-form"
        onSubmit={handleSubmit}
        className="max-h-[75vh] space-y-4 overflow-y-auto pr-1"
      >
        {/* Exact Expense / Purpose Field */}
        <div>
          <Input
            label="Exact Expense / What is this for?"
            name="description"
            placeholder="e.g., BMTC Bus Pass (1 Month), Airtel SIM Recharge, Dad's Jio"
            value={form.description}
            onChange={set('description')}
          />
          <p className="mt-1 text-xs text-slate-500">
            Specify the exact item or service to easily track what was paid for.
          </p>
        </div>

        {/* Amount & Date Spent */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount (₹)"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={set('amount')}
            error={errors.amount}
          />
          <Input
            label="Date Spent"
            name="spent_on"
            type="date"
            value={form.spent_on}
            onChange={set('spent_on')}
            error={errors.spent_on}
          />
        </div>

        {/* Valid Until / Last Date (Expiry / Renewal Date) */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Valid Until / Last Date (Notification Alert)</span>
            </div>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
              Alerts 5 days before
            </span>
          </div>

          <Input
            label="Last Date / Expiry Date (Optional)"
            name="expiry_date"
            type="date"
            min={form.spent_on}
            value={form.expiry_date ?? ''}
            onChange={set('expiry_date')}
            error={errors.expiry_date}
          />

          {/* Quick preset duration buttons */}
          <div className="mt-2.5">
            <p className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Quick duration from date spent:
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  applyDuration(28)
                  setForm((f) => ({ ...f, category: 'Mobile Recharge' }))
                }}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                📱 +28 Days (Recharge/SIM)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyDuration(56)
                  setForm((f) => ({ ...f, category: 'Mobile Recharge' }))
                }}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                📱 +56 Days (Recharge)
              </button>
              <button
                type="button"
                onClick={() => applyDuration(undefined, 1)}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                +1 Month (Pass)
              </button>
              <button
                type="button"
                onClick={() => applyDuration(84)}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                +84 Days (SIM)
              </button>
              <button
                type="button"
                onClick={() => applyDuration(undefined, 3)}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => applyDuration(undefined, undefined, 1)}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-800 dark:text-amber-300"
              >
                +1 Year
              </button>
              {form.expiry_date && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, expiry_date: '' }))}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category & Payment Method */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={form.category}
              onChange={set('category')}
              className={selectClass}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option value={c} key={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="payment_method"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Payment method
            </label>
            <select
              id="payment_method"
              value={form.payment_method}
              onChange={set('payment_method')}
              className={selectClass}
            >
              <option value="">—</option>
              {PAYMENT_METHODS.map((p) => (
                <option value={p} key={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  )
}

