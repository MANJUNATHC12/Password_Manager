import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatementUpload } from '@/components/statements/StatementUpload'
import { StatementReport } from '@/components/statements/StatementReport'
import {
  TransactionPreviewTable,
  type PreviewRow,
} from '@/components/statements/TransactionPreviewTable'
import { analyzeStatement } from '@/lib/statementAnalytics'
import type { DraftExpense } from '@/lib/statementParser'
import { createExpensesBatch } from '@/services/expenses'
import { formatCurrency } from '@/config/expenses'
import { getErrorMessage } from '@/utils/error'
import type { ExpenseForm } from '@/types'

export function StatementsPage() {
  const [rows, setRows] = useState<PreviewRow[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  const handleParsed = (parsed: DraftExpense[], file: File) => {
    // default to importing debit (expense) rows only
    setRows(parsed.map((r) => ({ ...r, include: r.isDebit })))
    setFileName(file.name)
    setImportedCount(null)
    setImportError(null)
  }

  const analytics = useMemo(
    () => (rows ? analyzeStatement(rows) : null),
    [rows],
  )

  const selected = rows?.filter((r) => r.include) ?? []

  const reset = () => {
    setRows(null)
    setFileName('')
    setImportedCount(null)
    setImportError(null)
  }

  const toggle = (key: number, include: boolean) =>
    setRows((prev) =>
      prev ? prev.map((r) => (r.key === key ? { ...r, include } : r)) : prev,
    )

  const toggleAll = (include: boolean) =>
    setRows((prev) => (prev ? prev.map((r) => ({ ...r, include })) : prev))

  const changeCategory = (key: number, category: string) =>
    setRows((prev) =>
      prev ? prev.map((r) => (r.key === key ? { ...r, category } : r)) : prev,
    )

  const handleImport = async () => {
    if (selected.length === 0) return
    setImporting(true)
    setImportError(null)
    try {
      const forms: ExpenseForm[] = selected.map((r) => ({
        amount: r.amount,
        category: r.category,
        description: r.description,
        payment_method: r.payment_method,
        spent_on: r.spent_on,
      }))
      const res = await createExpensesBatch(forms)
      setImportedCount(res.created)
    } catch (err) {
      setImportError(getErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statement analysis</h1>
          <p className="text-sm text-slate-500">
            Upload a bank statement to analyze spending and import transactions
          </p>
        </div>
        {rows && (
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Upload another
          </Button>
        )}
      </div>

      {!rows && <StatementUpload onParsed={handleParsed} />}

      {rows && analytics && (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <FileSpreadsheet className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700">{fileName}</span>
            <span className="text-slate-400">·</span>
            <span>{rows.length} transactions read</span>
          </div>

          <StatementReport analytics={analytics} />

          {/* Import section */}
          <Card className="p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  Review &amp; import transactions
                </h3>
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">
                  {selected.length}
                </span>{' '}
                selected ·{' '}
                <span className="font-semibold text-slate-900">
                  {formatCurrency(
                    selected.reduce((s, r) => s + Number(r.amount), 0),
                  )}
                </span>
              </p>
            </div>

            <TransactionPreviewTable
              rows={rows}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onCategoryChange={changeCategory}
            />

            {importError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {importError}
              </div>
            )}

            {importedCount != null ? (
              <div className="mt-4 flex flex-col items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    Imported{' '}
                    <span className="font-semibold">{importedCount}</span> transaction
                    {importedCount === 1 ? '' : 's'} into your expenses.
                  </span>
                </div>
                <Link to="/expenses">
                  <Button size="sm">View expenses</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleImport}
                  loading={importing}
                  disabled={selected.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Import {selected.length > 0 ? selected.length : ''} to expenses
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
