import api from './api'
import type {
  DocumentEntry,
  DocumentForm,
  DocumentList,
  ExpiringDocumentList,
} from '@/types'

function toFormData(form: DocumentForm): FormData {
  const fd = new FormData()
  fd.append('doc_type', form.doc_type)
  if (form.doc_number.trim()) fd.append('doc_number', form.doc_number.trim())
  if (form.holder_name.trim()) fd.append('holder_name', form.holder_name.trim())
  if (form.issue_date) fd.append('issue_date', form.issue_date)
  if (form.expiry_date) fd.append('expiry_date', form.expiry_date)
  if (form.notes.trim()) fd.append('notes', form.notes.trim())
  if (form.file) fd.append('file', form.file)
  return fd
}

export async function listDocuments(params: {
  page?: number
  page_size?: number
  doc_type?: string | null
  search?: string
}): Promise<DocumentList> {
  const { data } = await api.get<DocumentList>('/documents', { params })
  return data
}

export async function getExpiringDocuments(
  days = 10,
): Promise<ExpiringDocumentList> {
  const { data } = await api.get<ExpiringDocumentList>('/documents/expiring', {
    params: { days },
  })
  return data
}

export async function createDocument(form: DocumentForm): Promise<DocumentEntry> {
  const { data } = await api.post<DocumentEntry>('/documents', toFormData(form))
  return data
}

export async function updateDocument(
  id: string,
  form: DocumentForm,
): Promise<DocumentEntry> {
  const { data } = await api.patch<DocumentEntry>(
    `/documents/${id}`,
    toFormData(form),
  )
  return data
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/documents/${id}`)
}

export async function downloadDocument(id: string, filename?: string | null) {
  const { data } = await api.get(`/documents/${id}/file`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'document'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
