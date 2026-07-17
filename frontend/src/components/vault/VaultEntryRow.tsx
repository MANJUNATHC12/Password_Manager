import { Globe, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PasswordField } from './PasswordField'
import {
  CATEGORIES,
  getCategory,
  humanizeKey,
  type FieldDef,
} from '@/config/categories'
import type { VaultEntry } from '@/types'

const KNOWN = new Set(CATEGORIES.map((c) => c.value))

function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value)
  return m ? `${m[2]}/${m[1]}` : value
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 text-slate-500">{label}:</span>
      <span className="min-w-0 break-words text-slate-700">{children}</span>
    </div>
  )
}

export function VaultEntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: VaultEntry
  onEdit: () => void
  onDelete: () => void
}) {
  const known = KNOWN.has(entry.category)
  const fields: FieldDef[] = known ? getCategory(entry.category).fields : []
  const custom = entry.custom_fields ?? {}

  const renderCore = (key: string) => {
    switch (key) {
      case 'title':
        return null
      case 'password':
        return entry.password ? <PasswordField value={entry.password} /> : null
      case 'username':
        return entry.username ? <Line label="Username">{entry.username}</Line> : null
      case 'url':
        return entry.url ? (
          <Line label="URL">
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary-600 hover:underline"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="truncate">{entry.url}</span>
            </a>
          </Line>
        ) : null
      case 'totp_secret':
        return entry.totp_secret ? (
          <PasswordField value={entry.totp_secret} />
        ) : null
      case 'notes':
        return entry.notes ? (
          <p className="whitespace-pre-wrap text-sm text-slate-500">
            {entry.notes}
          </p>
        ) : null
      default:
        return null
    }
  }

  const customLines = known
    ? fields
        .filter((f) => !f.core)
        .map((f) => {
          const value = custom[f.key]
          if (!value) return null
          return (
            <Line key={f.key} label={f.label}>
              {f.secret ? (
                <PasswordField value={value} />
              ) : f.type === 'month' ? (
                formatMonth(value)
              ) : (
                value
              )}
            </Line>
          )
        })
    : Object.entries(custom).map(([key, value]) => (
        <Line key={key} label={humanizeKey(key)}>
          {value}
        </Line>
      ))

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {entry.title}
            </h3>
            <Badge>{entry.category}</Badge>
          </div>

          {fields.map((f) => (f.core ? renderCore(f.key) : null))}
          {customLines}
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit entry"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-2 text-red-500 hover:bg-red-50"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
