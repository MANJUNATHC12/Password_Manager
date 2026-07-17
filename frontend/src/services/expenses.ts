import api from './api'
import type {
  Expense,
  ExpenseForm,
  ExpenseList,
  ExpenseSummary,
} from '@/types'

function toPayload(form: ExpenseForm) {
  return {
    amount: Number(form.amount),
    category: form.category,
    description: form.description.trim() || null,
    payment_method: form.payment_method || null,
    spent_on: form.spent_on,
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

export async function createExpense(form: ExpenseForm): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses', toPayload(form))
  return data
}

export async function updateExpense(
  id: string,
  form: ExpenseForm,
): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/expenses/${id}`, toPayload(form))
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`)
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
  }))
  const { data } = await api.post<{ created: number }>('/expenses/batch', payload)
  return data
}
