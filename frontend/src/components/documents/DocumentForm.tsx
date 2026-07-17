import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DOC_TYPES } from '@/config/documents'
import type { DocumentEntry, DocumentForm } from '@/types'

interface Props {
  open: boolean
  doc: DocumentEntry | null
  submitting: boolean
  onClose: () => void
  onSubmit: (form: DocumentForm) => Promise<void>
}

const emptyForm: DocumentForm = {
  doc_type: 'Aadhaar',
  doc_number: '',
  holder_name: '',
  issue_date: '',
  expiry_date: '',
  notes: '',
  file: null,
}

export function DocumentFormModal({
  open,
  doc,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<DocumentForm>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (doc) {
      setForm({
        doc_type: doc.doc_type,
        doc_number: doc.doc_number ?? '',
        holder_name: doc.holder_name ?? '',
        issue_date: doc.issue_date ?? '',
        expiry_date: doc.expiry_date ?? '',
        notes: doc.notes ?? '',
        file: null,
      })
    } else {
      setForm(emptyForm)
    }
    setErrors({})
  }, [open, doc])

  const set = (key: keyof DocumentForm) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.doc_type) next.doc_type = 'Select a document type.'
    setErrors(next)
    if (Object.keys(next).length) return
    await onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doc ? 'Edit document' : 'Add document'}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="document-form" loading={submitting}>
            {doc ? 'Save changes' : 'Add document'}
          </Button>
        </>
      }
    >
      <form
        id="document-form"
        onSubmit={handleSubmit}
        className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"
      >
        <div>
          <label
            htmlFor="doc_type"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Document type <span className="text-red-500">*</span>
          </label>
          <select
            id="doc_type"
            value={form.doc_type}
            onChange={set('doc_type')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            {DOC_TYPES.map((t) => (
              <option value={t} key={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.doc_type && (
            <p className="mt-1 text-sm text-red-600">{errors.doc_type}</p>
          )}
        </div>

        <Input
          label="Document number"
          name="doc_number"
          placeholder="e.g. 1234 5678 9012"
          value={form.doc_number}
          onChange={set('doc_number')}
        />
        <Input
          label="Holder name"
          name="holder_name"
          placeholder="Name as on document"
          value={form.holder_name}
          onChange={set('holder_name')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Issue date"
            name="issue_date"
            type="date"
            value={form.issue_date}
            onChange={set('issue_date')}
          />
          <Input
            label="Expiry date"
            name="expiry_date"
            type="date"
            value={form.expiry_date}
            onChange={set('expiry_date')}
          />
        </div>

        <div>
          <label
            htmlFor="doc-notes"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Notes
          </label>
          <textarea
            id="doc-notes"
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder="Any extra details..."
            value={form.notes}
            onChange={set('notes')}
          />
        </div>

        <div>
          <label
            htmlFor="doc-file"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Attachment (optional)
          </label>
          <input
            id="doc-file"
            type="file"
            onChange={(e) =>
              setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
            }
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
          {doc?.has_file && !form.file && (
            <p className="mt-1 text-xs text-slate-500">
              Current file: {doc.file_name ?? 'attached'} (upload a new one to
              replace)
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}
