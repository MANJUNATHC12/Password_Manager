import api from './api'
import type {
  CategoryCount,
  VaultEntry,
  VaultEntryInput,
  VaultEntryList,
} from '@/types'

export async function listEntries(params: {
  page?: number
  page_size?: number
  category?: string | null
  search?: string
}): Promise<VaultEntryList> {
  const { data } = await api.get<VaultEntryList>('/vault', { params })
  return data
}

export async function getEntry(id: string): Promise<VaultEntry> {
  const { data } = await api.get<VaultEntry>(`/vault/${id}`)
  return data
}

export async function createEntry(input: VaultEntryInput): Promise<VaultEntry> {
  const { data } = await api.post<VaultEntry>('/vault', input)
  return data
}

export async function updateEntry(
  id: string,
  input: Partial<VaultEntryInput>,
): Promise<VaultEntry> {
  const { data } = await api.patch<VaultEntry>(`/vault/${id}`, input)
  return data
}

export async function deleteEntry(id: string): Promise<void> {
  await api.delete(`/vault/${id}`)
}

export async function listCategories(): Promise<CategoryCount[]> {
  const { data } = await api.get<CategoryCount[]>('/vault/categories')
  return data
}
