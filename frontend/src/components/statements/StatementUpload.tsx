import { useRef, useState } from 'react'
import { UploadCloud, FileText, AlertCircle, Lock } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  parseStatement,
  StatementPasswordError,
} from '@/lib/statementParser'
import type { DraftExpense } from '@/lib/statementParser'
import { getErrorMessage } from '@/utils/error'

interface Props {
  onParsed: (rows: DraftExpense[], file: File) => void
}

const ACCEPT = '.csv,.xls,.xlsx,.pdf'
const VALID_EXT = /\.(csv|xls|xlsx|pdf)$/i

export function StatementUpload({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // password prompt state (for encrypted PDFs)
  const [pwFile, setPwFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)

  const parse = async (file: File, pw?: string) => {
    const rows = await parseStatement(file, { password: pw })
    if (rows.length === 0) {
      throw new Error(
        'No transactions could be read from this file. Make sure it is a bank statement with date, description and amount columns.',
      )
    }
    onParsed(rows, file)
  }

  const handleFile = async (file: File) => {
    setError(null)
    setPwError(null)
    if (!VALID_EXT.test(file.name)) {
      setError('Unsupported file. Please upload a CSV, Excel (.xls/.xlsx), or PDF file.')
      return
    }
    setBusy(true)
    try {
      await parse(file)
    } catch (err) {
      if (err instanceof StatementPasswordError) {
        // switch to the password-entry view
        setPwFile(file)
        setPassword('')
      } else {
        setError(getErrorMessage(err) || 'Could not read this file.')
      }
    } finally {
      setBusy(false)
    }
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwFile || !password) return
    setBusy(true)
    setPwError(null)
    try {
      await parse(pwFile, password)
      setPwFile(null)
      setPassword('')
    } catch (err) {
      if (err instanceof StatementPasswordError) {
        setPwError(err.message)
      } else {
        setPwFile(null)
        setError(getErrorMessage(err) || 'Could not read this file.')
      }
    } finally {
      setBusy(false)
    }
  }

  const cancelPassword = () => {
    setPwFile(null)
    setPassword('')
    setPwError(null)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // --- Encrypted-PDF password prompt ---
  if (pwFile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-slate-800">This statement is protected</p>
            <p className="text-sm text-slate-500">
              Enter the password for{' '}
              <span className="font-medium text-slate-700">{pwFile.name}</span>
            </p>
          </div>
        </div>

        <form onSubmit={submitPassword} className="mt-4 space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Statement password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={pwError ?? undefined}
          />
          <p className="text-xs text-slate-400">
            Bank PDF passwords are often a mix of your name, account number, or date
            of birth — check the email the statement came with.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={cancelPassword} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!password}>
              Unlock &amp; analyze
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition',
          dragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50',
        ].join(' ')}
      >
        {busy ? (
          <>
            <Spinner className="h-8 w-8 text-primary-600" />
            <p className="text-sm font-medium text-slate-600">Analyzing statement…</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium text-slate-700">
                Drop your bank statement here, or click to browse
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Supports CSV, Excel (.xls / .xlsx) and PDF (including password-protected)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FileText className="h-3.5 w-3.5" />
              We analyze the file in your browser — nothing is uploaded until you import.
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
