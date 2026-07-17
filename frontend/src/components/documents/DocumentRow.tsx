import { Calendar, Download, FileText, Pencil, Trash2, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { DocumentEntry } from '@/types'

export function DocumentRow({
  doc,
  onEdit,
  onDelete,
  onDownload,
}: {
  doc: DocumentEntry
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
}) {
  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {doc.doc_type}
            </h3>
            <Badge>Document</Badge>
          </div>
          {doc.doc_number && (
            <p className="text-sm text-slate-600">
              <span className="text-slate-500">No: </span>
              {doc.doc_number}
            </p>
          )}
          {doc.holder_name && (
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {doc.holder_name}
            </p>
          )}
          {(doc.issue_date || doc.expiry_date) && (
            <p className="flex items-center gap-1.5 text-sm text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {doc.issue_date || '—'} → {doc.expiry_date || '—'}
            </p>
          )}
          {doc.notes && (
            <p className="whitespace-pre-wrap text-sm text-slate-500">
              {doc.notes}
            </p>
          )}
          {doc.has_file && (
            <button
              onClick={onDownload}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              <Download className="h-4 w-4" />
              {doc.file_name || 'Download file'}
            </button>
          )}
          {!doc.has_file && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              No attachment
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit document"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-2 text-red-500 hover:bg-red-50"
            aria-label="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
