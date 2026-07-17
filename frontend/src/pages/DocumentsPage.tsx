import { useCallback, useEffect, useState } from 'react'
import {
  FilePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { DocumentRow } from '@/components/documents/DocumentRow'
import { DocumentFormModal } from '@/components/documents/DocumentForm'
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from '@/services/documents'
import { getErrorMessage } from '@/utils/error'
import { cn } from '@/utils/cn'
import { useExpiringDocuments } from '@/hooks/useExpiringDocuments'
import { DOC_TYPES } from '@/config/documents'
import type { DocumentEntry, DocumentForm, ExpiringDocument } from '@/types'

function expiryLabel(d: ExpiringDocument): string {
  const n = Math.abs(d.days_until_expiry)
  if (d.expired) return `Expired ${n} day${n === 1 ? '' : 's'} ago`
  if (d.days_until_expiry === 0) return 'Expires today'
  return `Expires in ${d.days_until_expiry} day${d.days_until_expiry === 1 ? '' : 's'}`
}

const PAGE_SIZE = 20

export function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentEntry[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [docType, setDocType] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { items: expiring } = useExpiringDocuments()

  const [reloadToken, setReloadToken] = useState(0)
  const reload = () => {
    setReloadToken((t) => t + 1)
    window.dispatchEvent(new Event('documents:changed'))
  }

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listDocuments({
        page,
        page_size: PAGE_SIZE,
        doc_type: docType || null,
        search: search || undefined,
      })
      setDocs(res.entries)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, docType, search, reloadToken])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [docType, search])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (doc: DocumentEntry) => {
    setEditing(doc)
    setFormOpen(true)
  }

  const handleSubmit = async (form: DocumentForm) => {
    setSubmitting(true)
    try {
      if (editing) await updateDocument(editing.id, form)
      else await createDocument(form)
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
      await deleteDocument(deleteTarget.id)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            {total} {total === 1 ? 'document' : 'documents'} stored
          </p>
        </div>
        <Button onClick={openCreate}>
          <FilePlus className="h-4 w-4" />
          Add document
        </Button>
      </div>

      {expiring.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-medium text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {expiring.length} document{expiring.length === 1 ? '' : 's'} expiring
            soon
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {expiring.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 text-amber-800"
              >
                <span className="truncate">
                  {d.doc_type}
                  {d.doc_number ? ` · ${d.doc_number}` : ''}
                  {d.holder_name ? ` · ${d.holder_name}` : ''}
                </span>
                <span
                  className={cn(
                    'shrink-0 whitespace-nowrap font-semibold',
                    d.expired ? 'text-red-600' : 'text-amber-700',
                  )}
                >
                  {expiryLabel(d)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by type, number or holder..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:w-48"
        >
          <option value="">All types</option>
          {DOC_TYPES.map((t) => (
            <option value={t} key={t}>
              {t}
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
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FilePlus className="h-6 w-6" />
          </div>
          <p className="font-medium text-slate-700">No documents yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || docType
              ? 'Try adjusting your search or filter.'
              : 'Add your first document (Aadhaar, PAN, passport, …).'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onEdit={() => openEdit(doc)}
              onDelete={() => setDeleteTarget(doc)}
              onDownload={() => downloadDocument(doc.id, doc.file_name)}
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

      <DocumentFormModal
        open={formOpen}
        doc={editing}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete document"
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
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.doc_type}
          </span>
          ? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
