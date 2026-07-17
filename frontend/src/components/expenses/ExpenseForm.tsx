import { useEffect, useState } from 'react'
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
  category: 'Food & Dining',
  description: '',
  payment_method: 'UPI',
  spent_on: today(),
})

const selectClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const amount = Number(form.amount)
    if (!form.amount || Number.isNaN(amount) || amount <= 0)
      next.amount = 'Enter an amount greater than 0.'
    if (!form.spent_on) next.spent_on = 'Pick a date.'
    if (!form.category) next.category = 'Select a category.'
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
        className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"
      >
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
            label="Date"
            name="spent_on"
            type="date"
            value={form.spent_on}
            onChange={set('spent_on')}
            error={errors.spent_on}
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-sm font-medium text-slate-700"
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
            className="mb-1.5 block text-sm font-medium text-slate-700"
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

        <div>
          <label
            htmlFor="expense-notes"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="expense-notes"
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="What was this for?"
            value={form.description}
            onChange={set('description')}
          />
        </div>
      </form>
    </Modal>
  )
}
