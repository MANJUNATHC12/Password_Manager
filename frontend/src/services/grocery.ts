import api from './api'
import type { GroceryItem, GroceryList, GrocerySummary, GroceryForm } from '@/types'

function toPayload(form: GroceryForm, month: string) {
  return {
    month,
    name: form.name.trim(),
    quantity: Number(form.quantity) || 1,
    unit: form.unit,
    category: form.category,
    estimated_price: form.estimated_price ? Number(form.estimated_price) : null,
    notes: form.notes.trim() || null,
  }
}

export async function listGroceryItems(params: {
  month?: string | null
  category?: string | null
  is_purchased?: boolean | null
}): Promise<GroceryList> {
  const { data } = await api.get<GroceryList>('/grocery', { params })
  return data
}

export async function getGrocerySummary(month?: string): Promise<GrocerySummary> {
  const { data } = await api.get<GrocerySummary>('/grocery/summary', {
    params: month ? { month } : undefined,
  })
  return data
}

export async function createGroceryItem(
  form: GroceryForm,
  month: string,
): Promise<GroceryItem> {
  const { data } = await api.post<GroceryItem>('/grocery', toPayload(form, month))
  return data
}

export async function updateGroceryItem(
  id: string,
  updates: Partial<{
    name: string
    quantity: number
    unit: string
    category: string
    estimated_price: number | null
    is_purchased: boolean
    notes: string | null
  }>,
): Promise<GroceryItem> {
  const { data } = await api.patch<GroceryItem>(`/grocery/${id}`, updates)
  return data
}

export async function deleteGroceryItem(id: string): Promise<void> {
  await api.delete(`/grocery/${id}`)
}

export async function copyGroceryMonth(
  from_month: string,
  to_month: string,
): Promise<{ copied: number; items: GroceryItem[] }> {
  const { data } = await api.post<{ copied: number; items: GroceryItem[] }>(
    '/grocery/copy',
    { from_month, to_month },
  )
  return data
}
