import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Check,
  Trash2,
  Pencil,
  Copy,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import {
  listGroceryItems,
  getGrocerySummary,
  createGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  copyGroceryMonth,
} from '@/services/grocery'
import { getErrorMessage } from '@/utils/error'
import {
  GROCERY_CATEGORIES,
  GROCERY_UNITS,
  CATEGORY_EMOJI,
  groceryCategoryColor,
  formatCurrency,
  currentMonth,
  previousMonth,
  formatMonthLabel,
  monthOptions,
} from '@/config/grocery'
import type { GroceryItem, GrocerySummary, GroceryList, GroceryForm } from '@/types'

// ─── Empty form ───────────────────────────────────────────────
const EMPTY_FORM: GroceryForm = {
  name: '',
  quantity: '1',
  unit: 'pcs',
  category: 'Vegetables',
  estimated_price: '',
  notes: '',
}

// ─── Item card component ──────────────────────────────────────
function GroceryItemCard({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: GroceryItem
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
        item.is_purchased
          ? 'border-green-200 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20'
          : 'border-slate-200 bg-white hover:border-primary-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-800'
      }`}
    >
      {/* Checkbox */}
      <button
        id={`grocery-check-${item.id}`}
        onClick={onToggle}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${
          item.is_purchased
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-slate-300 hover:border-primary-400'
        }`}
        title={item.is_purchased ? 'Mark as not purchased' : 'Mark as purchased'}
      >
        {item.is_purchased && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            item.is_purchased
              ? 'text-slate-500 line-through dark:text-slate-400'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {item.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {item.quantity} {item.unit}
          {item.notes && ` · ${item.notes}`}
        </p>
      </div>

      {/* Price */}
      {item.estimated_price != null && (
        <span
          className={`shrink-0 text-sm font-semibold ${
            item.is_purchased
              ? 'text-slate-500 dark:text-slate-500'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {formatCurrency(item.estimated_price * item.quantity)}
        </span>
      )}

      {/* Actions – visible on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          id={`grocery-edit-${item.id}`}
          onClick={onEdit}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          id={`grocery-delete-${item.id}`}
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Add / Edit form modal ────────────────────────────────────
function GroceryFormModal({
  open,
  editing,
  submitting,
  month: _month,
  onClose,
  onSubmit,
}: {
  open: boolean
  editing: GroceryItem | null
  submitting: boolean
  month: string
  onClose: () => void
  onSubmit: (form: GroceryForm) => void
}) {
  void _month // kept in props for potential future use (e.g. showing context in the form title)
  const [form, setForm] = useState<GroceryForm>(EMPTY_FORM)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          quantity: String(editing.quantity),
          unit: editing.unit,
          category: editing.category,
          estimated_price: editing.estimated_price != null ? String(editing.estimated_price) : '',
          notes: editing.notes ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setTimeout(() => nameRef.current?.focus(), 80)
    }
  }, [open, editing])

  const set = (key: keyof GroceryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
  const labelCls = 'mb-1 block text-xs font-medium text-slate-600'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit grocery item' : 'Add grocery item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button form="grocery-form" type="submit" loading={submitting}>
            {editing ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <form id="grocery-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className={labelCls} htmlFor="gf-name">Item name *</label>
          <input
            id="gf-name"
            ref={nameRef}
            value={form.name}
            onChange={set('name')}
            required
            placeholder="e.g. Tomatoes"
            className={inputCls}
          />
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="gf-qty">Quantity *</label>
            <input
              id="gf-qty"
              type="number"
              min="0.001"
              step="any"
              value={form.quantity}
              onChange={set('quantity')}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="gf-unit">Unit</label>
            <select id="gf-unit" value={form.unit} onChange={set('unit')} className={inputCls}>
              {GROCERY_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className={labelCls} htmlFor="gf-cat">Category</label>
          <select id="gf-cat" value={form.category} onChange={set('category')} className={inputCls}>
            {GROCERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
            ))}
          </select>
        </div>

        {/* Estimated price */}
        <div>
          <label className={labelCls} htmlFor="gf-price">Estimated price per unit (₹)</label>
          <input
            id="gf-price"
            type="number"
            min="0"
            step="any"
            value={form.estimated_price}
            onChange={set('estimated_price')}
            placeholder="Optional"
            className={inputCls}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls} htmlFor="gf-notes">Notes</label>
          <textarea
            id="gf-notes"
            value={form.notes}
            onChange={set('notes')}
            rows={2}
            placeholder="Brand preference, size, etc."
            className={`${inputCls} resize-none`}
          />
        </div>
      </form>
    </Modal>
  )
}

// ─── Copy Month Modal ─────────────────────────────────────────
function CopyMonthModal({
  open,
  currentMonth: targetMonth,
  onClose,
  onCopy,
  copying,
}: {
  open: boolean
  currentMonth: string
  onClose: () => void
  onCopy: (from: string) => void
  copying: boolean
}) {
  const opts = monthOptions(12).filter((o) => o.value !== targetMonth)
  const [from, setFrom] = useState(previousMonth(targetMonth))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Copy list from another month"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={copying}>Cancel</Button>
          <Button onClick={() => onCopy(from)} loading={copying}>
            <Copy className="h-4 w-4" /> Copy items
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        All items from the selected month will be copied to{' '}
        <span className="font-semibold text-slate-800">{formatMonthLabel(targetMonth)}</span>{' '}
        with their purchased status reset.
      </p>
      <label className="mb-1 block text-xs font-medium text-slate-600">Copy from</label>
      <select
        id="copy-from-month"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export function GroceryPage() {
  const [month, setMonth] = useState(currentMonth)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showPurchased, setShowPurchased] = useState<'all' | 'pending' | 'done'>('all')

  const [list, setList] = useState<GroceryList | null>(null)
  const [summary, setSummary] = useState<GrocerySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GroceryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<GroceryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [copyOpen, setCopyOpen] = useState(false)
  const [copying, setCopying] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)
  const reload = () => setReloadToken((t) => t + 1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, summaryRes] = await Promise.all([
        listGroceryItems({ month }),
        getGrocerySummary(month),
      ])
      setList(listRes)
      setSummary(summaryRes)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [month, reloadToken])

  useEffect(() => { load() }, [load])

  // ── Filtering ─────────────────────────────────────────────
  const displayedItems = (list?.items ?? []).filter((item) => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && item.category !== categoryFilter) return false
    if (showPurchased === 'pending' && item.is_purchased) return false
    if (showPurchased === 'done' && !item.is_purchased) return false
    return true
  })

  // Group by category
  const grouped = displayedItems.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  // ── Handlers ──────────────────────────────────────────────
  const handleToggle = async (item: GroceryItem) => {
    try {
      await updateGroceryItem(item.id, { is_purchased: !item.is_purchased })
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleSubmit = async (form: GroceryForm) => {
    setSubmitting(true)
    try {
      if (editing) {
        await updateGroceryItem(editing.id, {
          name: form.name.trim(),
          quantity: Number(form.quantity),
          unit: form.unit,
          category: form.category,
          estimated_price: form.estimated_price ? Number(form.estimated_price) : null,
          notes: form.notes.trim() || null,
        })
      } else {
        await createGroceryItem(form, month)
      }
      setFormOpen(false)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGroceryItem(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = async (from: string) => {
    setCopying(true)
    try {
      await copyGroceryMonth(from, month)
      setCopyOpen(false)
      reload()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCopying(false)
    }
  }

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (item: GroceryItem) => { setEditing(item); setFormOpen(true) }

  const progress = summary && summary.total > 0
    ? Math.round((summary.purchased / summary.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Monthly Grocery</h1>
          <p className="text-sm text-slate-500">Plan and track your monthly shopping list</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="grocery-copy-btn"
            variant="secondary"
            onClick={() => setCopyOpen(true)}
            title="Copy list from another month"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Copy from month</span>
          </Button>
          <Button id="grocery-add-btn" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
      </div>

      {/* ── Month picker ────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            id="grocery-month-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-4 pr-9 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          >
            {monthOptions().map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total items */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Items</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{summary.total}</p>
          </div>

          {/* Purchased */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-green-700">Purchased</p>
            <p className="mt-1 text-3xl font-bold text-green-700">{summary.purchased}</p>
          </div>

          {/* Remaining */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-amber-700">Remaining</p>
            <p className="mt-1 text-3xl font-bold text-amber-700">{summary.remaining}</p>
          </div>

          {/* Estimated total */}
          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 shadow-sm">
            <p className="text-xs font-medium text-primary-700">Est. Total</p>
            <p className="mt-1 text-xl font-bold text-primary-700">
              {formatCurrency(summary.estimated_total)}
            </p>
          </div>
        </div>
      )}

      {/* ── Progress bar ────────────────────────────────────── */}
      {summary && summary.total > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Shopping progress</span>
            <span className="font-semibold text-slate-700">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="grocery-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          id="grocery-cat-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:w-48"
        >
          <option value="">All categories</option>
          {GROCERY_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
          ))}
        </select>

        {/* Status filter */}
        <div className="flex rounded-lg border border-slate-300 bg-white text-sm shadow-sm">
          {(['all', 'pending', 'done'] as const).map((v) => (
            <button
              key={v}
              id={`grocery-filter-${v}`}
              onClick={() => setShowPurchased(v)}
              className={`px-3 py-2 font-medium capitalize transition-colors first:rounded-l-lg last:rounded-r-lg ${
                showPurchased === v
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-primary-600" />
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            🛒
          </div>
          <p className="font-semibold text-slate-700">No grocery items</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || categoryFilter
              ? 'Try adjusting your filters.'
              : 'Add your first item or copy from a previous month.'}
          </p>
          {!search && !categoryFilter && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add item
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setCopyOpen(true)}>
                <Copy className="h-4 w-4" /> Copy from month
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([cat, items]) => (
              <div key={cat}>
                {/* Category header */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_EMOJI[cat] ?? '🛒'}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: groceryCategoryColor(cat) }}
                  >
                    {cat}
                  </span>
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {items.filter((i) => i.is_purchased).length}/{items.length}
                  </span>
                  <div className="ml-auto text-xs font-medium text-slate-500">
                    {formatCurrency(
                      items.reduce(
                        (s, i) => s + (i.estimated_price ?? 0) * i.quantity,
                        0,
                      ),
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <GroceryItemCard
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggle(item)}
                      onEdit={() => openEdit(item)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Category breakdown ───────────────────────────────── */}
      {summary && summary.by_category.length > 0 && summary.estimated_total > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-700">Budget breakdown by category</p>
          <div className="space-y-3">
            {summary.by_category
              .filter((c) => c.total > 0)
              .map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-6 text-center text-base">{CATEGORY_EMOJI[c.category] ?? '🛒'}</span>
                  <span className="w-36 shrink-0 truncate text-sm text-slate-600">{c.category}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${summary.estimated_total > 0 ? (c.total / summary.estimated_total) * 100 : 0}%`,
                        backgroundColor: groceryCategoryColor(c.category),
                      }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-sm font-medium text-slate-800">
                    {formatCurrency(c.total)}
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs text-slate-400">
                    {c.purchased}/{c.count} done
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      <GroceryFormModal
        open={formOpen}
        editing={editing}
        submitting={submitting}
        month={month}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <CopyMonthModal
        open={copyOpen}
        currentMonth={month}
        onClose={() => setCopyOpen(false)}
        onCopy={handleCopy}
        copying={copying}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete grocery item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-900">"{deleteTarget?.name}"</span>?
          This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
