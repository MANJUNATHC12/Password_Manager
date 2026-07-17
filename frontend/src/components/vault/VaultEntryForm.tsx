import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CATEGORIES, getCategory, type FieldDef } from '@/config/categories'
import type { VaultEntry, VaultEntryInput } from '@/types'

interface Props {
  open: boolean
  entry: VaultEntry | null
  submitting: boolean
  onClose: () => void
  onSubmit: (input: VaultEntryInput) => Promise<void>
}

type FormState = Record<string, string>

function buildInitialState(entry: VaultEntry | null, categoryValue: string): FormState {
  const cat = getCategory(categoryValue)
  const state: FormState = {}
  for (const field of cat.fields) {
    if (field.core) {
      state[field.key] = (entry?.[field.key as keyof VaultEntry] as string) ?? ''
    } else {
      state[field.key] = entry?.custom_fields?.[field.key] ?? ''
    }
  }
  return state
}

export function VaultEntryForm({
  open,
  entry,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [category, setCategory] = useState<string>('Login')
  const [form, setForm] = useState<FormState>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const activeCategory = useMemo(() => getCategory(category), [category])

  // Initialise when the modal opens (or the target entry changes).
  useEffect(() => {
    if (!open) return
    const initialCategory = entry?.category ?? 'Login'
    setCategory(initialCategory)
    setForm(buildInitialState(entry, initialCategory))
    setErrors({})
    setRevealed({})
  }, [open, entry])

  // When the user changes category, keep any values whose keys still exist.
  const onCategoryChange = (value: string) => {
    setCategory(value)
    const nextFields = getCategory(value).fields
    setForm((prev) => {
      const next: FormState = {}
      for (const f of nextFields) next[f.key] = prev[f.key] ?? ''
      return next
    })
    setErrors({})
  }

  const setField = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const next: Record<string, string> = {}
    for (const field of activeCategory.fields) {
      if (field.required && !form[field.key]?.trim()) {
        next[field.key] = `${field.label} is required.`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const input: VaultEntryInput = {
      title: '',
      category,
      // reset core columns not used by this category to null
      username: null,
      password: null,
      url: null,
      totp_secret: null,
      notes: null,
    }
    const custom: Record<string, string> = {}

    for (const field of activeCategory.fields) {
      const raw = form[field.key] ?? ''
      const value = field.type === 'textarea' ? raw : raw.trim()
      if (field.core) {
        // title is required by the backend and always present
        ;(input as unknown as Record<string, unknown>)[field.key] =
          field.key === 'title' ? value : value || null
      } else if (value) {
        custom[field.key] = value
      }
    }

    input.custom_fields = Object.keys(custom).length ? custom : null
    await onSubmit(input)
  }

  const toggleReveal = (key: string) =>
    setRevealed((r) => ({ ...r, [key]: !r[key] }))

  const renderField = (field: FieldDef) => {
    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <label
            htmlFor={field.key}
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            id={field.key}
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            placeholder={field.placeholder}
            value={form[field.key] ?? ''}
            onChange={(e) => setField(field.key, e.target.value)}
          />
          {errors[field.key] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
          )}
        </div>
      )
    }

    const isSecret = field.type === 'password' || field.secret
    const shown = revealed[field.key]
    const inputType =
      field.type === 'password'
        ? shown
          ? 'text'
          : 'password'
        : field.secret
          ? shown
            ? 'text'
            : 'password'
          : field.type === 'month'
            ? 'text'
            : field.type

    return (
      <Input
        key={field.key}
        label={
          field.required ? `${field.label} *` : field.label
        }
        name={field.key}
        type={inputType}
        placeholder={field.placeholder}
        value={form[field.key] ?? ''}
        onChange={(e) => setField(field.key, e.target.value)}
        error={errors[field.key]}
        autoComplete="off"
        trailing={
          isSecret ? (
            <button
              type="button"
              onClick={() => toggleReveal(field.key)}
              className="rounded p-1 text-slate-400 hover:text-slate-600"
              aria-label={shown ? 'Hide' : 'Show'}
            >
              {shown ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : undefined
        }
      />
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? 'Edit entry' : 'Add entry'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="vault-entry-form" loading={submitting}>
            {entry ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <form
        id="vault-entry-form"
        onSubmit={handleSubmit}
        className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"
      >
        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            {CATEGORIES.map((c) => (
              <option value={c.value} key={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {activeCategory.fields.map(renderField)}
      </form>
    </Modal>
  )
}
