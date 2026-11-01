import api from './api'
import type {
  Expense,
  ExpenseForm,
  ExpenseList,
  ExpenseSummary,
  ExpiringExpenseList,
} from '@/types'

function toPayload(form: ExpenseForm) {
  return {
    amount: Number(form.amount),
    category: form.category,
    description: form.description.trim() || null,
    payment_method: form.payment_method || null,
    spent_on: form.spent_on,
    expiry_date: form.expiry_date && form.expiry_date.trim() ? form.expiry_date.trim() : null,
  }
}

export async function listExpenses(params: {
  page?: number
  page_size?: number
  month?: string | null
  category?: string | null
}): Promise<ExpenseList> {
  const { data } = await api.get<ExpenseList>('/expenses', { params })
  return data
}

export async function getExpenseSummary(
  month?: string,
): Promise<ExpenseSummary> {
  const { data } = await api.get<ExpenseSummary>('/expenses/summary', {
    params: month ? { month } : undefined,
  })
  return data
}

export async function getExpiringExpenses(
  days = 5,
): Promise<ExpiringExpenseList> {
  const { data } = await api.get<ExpiringExpenseList>('/expenses/expiring', {
    params: { days },
  })
  return data
}

export async function createExpense(form: ExpenseForm): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses', toPayload(form))
  window.dispatchEvent(new Event('expenses:changed'))
  return data
}

export async function updateExpense(
  id: string,
  form: ExpenseForm,
): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/expenses/${id}`, toPayload(form))
  window.dispatchEvent(new Event('expenses:changed'))
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`)
  window.dispatchEvent(new Event('expenses:changed'))
}

export async function createExpensesBatch(
  forms: ExpenseForm[],
): Promise<{ created: number }> {
  const payload = forms.map((f) => ({
    amount: Number(f.amount),
    category: f.category,
    description: f.description.trim() || null,
    payment_method: f.payment_method || null,
    spent_on: f.spent_on,
    expiry_date: f.expiry_date && f.expiry_date.trim() ? f.expiry_date.trim() : null,
  }))
  const { data } = await api.post<{ created: number }>('/expenses/batch', payload)
  window.dispatchEvent(new Event('expenses:changed'))
  return data
}
