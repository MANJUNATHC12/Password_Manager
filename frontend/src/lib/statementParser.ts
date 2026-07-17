import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'
import { Buffer } from 'buffer'
import { isEncrypted, decrypt } from 'officecrypto-tool'
import type { ExpenseForm } from '@/types'

// Resolve the worker as an absolute URL (Vite handles this at build time).
// A plain string is required by pdf.js's `workerSrc` setter.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href

export type StatementFormat = 'excel' | 'pdf'

export interface DraftExpense extends ExpenseForm {
  /** stable index within the parsed file (for React keys) */
  key: number
  /** true for money leaving the account, false for money received */
  isDebit: boolean
}

// --- shared helpers ---------------------------------------------------------

const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/\b(swiggy|zomato|uber eats|eats|restaurant|hotel|food|domino|cafe|fnbfood|dine)\b/i, 'Food & Dining'],
  [/\b(big ?bazaar|bigbazaar|grofer|grocery|supermarket|dmart|reliance fresh|relianceretail|vishal|more\.retail|spencers)\b/i, 'Groceries'],
  [/\b(uber|ola|rapido|metro|irctc|rail|bus|petrol|diesel|fuel|parking|toll|flight)\b/i, 'Transport'],
  [/\b(amazon|flipkart|myntra|ajio|meesho|snapdeal|mall|store|retail)\b/i, 'Shopping'],
  [/\b(electric|water|gas|airtel|jio|vi\b|bsnl|broadband|internet|bill|recharge|postpaid)\b/i, 'Bills & Utilities'],
  [/\b(rent|housing|society|maintenance)\b/i, 'Rent'],
  [/\b(netflix|hotstar|spotify|prime|bookmyshow|pvr|cinema|game|playstation|xbox|entertain)\b/i, 'Entertainment'],
  [/\b(pharma|medical|hospital|doctor|clinic|apollo|medplus|health)\b/i, 'Health'],
  [/\b(school|college|university|course|tuition|exam|edu)\b/i, 'Education'],
  [/\b(irctc|makemytrip|goibibo|yatra|trip|travel|hotel stay|oyo)\b/i, 'Travel'],
  [/\b(mutual|sip|gold|stock|groww|zerodha|coin|invest)\b/i, 'Investments'],
]

function inferCategory(description: string): string {
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(description)) return cat
  }
  return 'Other'
}

/** Parse a date cell into a YYYY-MM-DD string, or null if unparseable. */
function parseDateCell(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(
        parsed.d,
      ).padStart(2, '0')}`
    }
    return null
  }
  const text = String(value).trim()
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const d = new Date(text)
    if (!Number.isNaN(d.getTime())) return text.slice(0, 10)
  }
  // DD-MM-YYYY or DD/MM/YYYY (common in Indian statements)
  const dm = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
  if (dm) {
    let [, dd, mm, yyyy] = dm
    if (yyyy.length === 2) yyyy = `20${yyyy}`
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    if (!Number.isNaN(d.getTime())) {
      return `${yyyy}-${String(Number(mm)).padStart(2, '0')}-${String(
        Number(dd),
      ).padStart(2, '0')}`
    }
  }
  const fallback = new Date(text)
  if (!Number.isNaN(fallback.getTime())) {
    const y = fallback.getFullYear()
    const m = String(fallback.getMonth() + 1).padStart(2, '0')
    const d = String(fallback.getDate()).padStart(2, '0')
    if (y > 2000) return `${y}-${m}-${d}`
  }
  return null
}

/** Clean an amount string/number into a float, or null. */
function parseAmount(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, '')
    .replace(/^[^\d-]+/, '')
    .replace(/[^\d.\-].*$/, '')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isNaN(n) ? null : n
}

function normalizeAmount(raw: number | null): {
  amount: number
  isDebit: boolean
} | null {
  if (raw == null) return null
  if (raw < 0) return { amount: -raw, isDebit: true }
  return { amount: raw, isDebit: false }
}

// --- spreadsheet (CSV / Excel) ----------------------------------------------

interface Columns {
  date: number
  desc: number
  debit: number
  credit: number
  amount: number
}

const normHeader = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')

/** Match a keyword against a normalized header. Very short keys (dr/cr) must
 *  match exactly to avoid false hits (e.g. "cr" inside "description"). */
function matchesKey(header: string, key: string): boolean {
  if (key.length <= 2) return header === key
  return header.includes(key)
}

function findColumns(headers: string[]): Columns {
  const normd = headers.map(normHeader)
  const idx = (keys: string[], exclude: string[] = []) =>
    normd.findIndex(
      (n) =>
        n !== '' &&
        keys.some((k) => matchesKey(n, k)) &&
        !exclude.some((e) => n.includes(e)),
    )
  return {
    date: idx([
      'date',
      'txndate',
      'transactiondate',
      'valuedate',
      'postingdate',
      'trandate',
      'bookingdate',
    ]),
    desc: idx([
      'desc',
      'description',
      'narration',
      'narrative',
      'particular',
      'details',
      'remark',
      'transaction',
      'reference',
    ]),
    debit: idx(['debit', 'withdrawal', 'withdraw', 'dr', 'paidout']),
    credit: idx(['credit', 'deposit', 'cr', 'paidin']),
    // "amount" but not a running balance column
    amount: idx(['amount', 'amt'], ['balance', 'closing', 'opening']),
  }
}

function columnScore(c: Columns): number {
  return (
    (c.date >= 0 ? 1 : 0) +
    (c.desc >= 0 ? 1 : 0) +
    (c.debit >= 0 ? 1 : 0) +
    (c.credit >= 0 ? 1 : 0) +
    (c.amount >= 0 ? 1 : 0)
  )
}

/** A header row is usable if it has a date column and at least one money column. */
function isUsableHeader(c: Columns): boolean {
  return c.date >= 0 && (c.debit >= 0 || c.credit >= 0 || c.amount >= 0)
}

function rowsToDrafts(
  rows: unknown[][],
  startIdx: number,
  cols: Columns,
): DraftExpense[] {
  const drafts: DraftExpense[] = []
  let key = 0
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every((c) => c === '' || c == null)) continue

    const date = cols.date >= 0 ? parseDateCell(row[cols.date]) : null
    // A real transaction row always has a valid date. Skipping date-less rows
    // excludes preamble, sub-headers and summary/footer rows (e.g. a
    // "Total Debits" line) that would otherwise be miscounted as transactions.
    if (cols.date >= 0 && !date) continue

    const desc = cols.desc >= 0 ? String(row[cols.desc] ?? '').trim() : ''
    const debit = cols.debit >= 0 ? parseAmount(row[cols.debit]) : null
    const credit = cols.credit >= 0 ? parseAmount(row[cols.credit]) : null
    const amount = cols.amount >= 0 ? parseAmount(row[cols.amount]) : null

    // The column determines direction: Debit = expense, Credit = income.
    if (debit != null && debit !== 0) {
      drafts.push(makeDraft(key++, Math.abs(debit), true, date, desc))
      continue
    }
    if (credit != null && credit !== 0) {
      drafts.push(makeDraft(key++, Math.abs(credit), false, date, desc))
      continue
    }
    // Single signed amount column: negative = debit (expense), positive = income.
    if (amount != null && amount !== 0) {
      const norm = normalizeAmount(amount)
      if (norm) drafts.push(makeDraft(key++, norm.amount, norm.isDebit, date, desc))
    }
  }
  return drafts
}

/** Fallback when no header row is found: detect the date column and a money
 *  column purely from the cell contents. */
function parseByContent(rows: unknown[][]): DraftExpense[] {
  const width = rows.reduce((m, r) => Math.max(m, r?.length ?? 0), 0)
  if (width === 0) return []

  const dateHits = new Array(width).fill(0)
  const numHits = new Array(width).fill(0)

  for (const row of rows) {
    if (!row) continue
    for (let c = 0; c < width; c++) {
      const v = row[c]
      if (v === '' || v == null) continue
      if (parseDateCell(v)) dateHits[c]++
      if (parseAmount(v) != null) numHits[c]++
    }
  }

  const dateCol = dateHits.indexOf(Math.max(...dateHits))
  if (dateHits[dateCol] < 2) return [] // no plausible date column

  // Pick the amount column: a numeric column (not the date col) that varies the
  // most row-to-row (a running balance changes monotonically and is excluded by
  // preferring the column with the most sign changes / smallest magnitude spread).
  let amountCol = -1
  let bestScore = -1
  for (let c = 0; c < width; c++) {
    if (c === dateCol || numHits[c] < 2) continue
    // Take the richest numeric column (most populated) as the amount column.
    const score = numHits[c]
    if (score > bestScore) {
      bestScore = score
      amountCol = c
    }
  }
  if (amountCol < 0) return []

  const cols: Columns = {
    date: dateCol,
    desc: [0, 1, 2].find((c) => c !== dateCol && c !== amountCol) ?? -1,
    debit: -1,
    credit: -1,
    amount: amountCol,
  }
  return rowsToDrafts(rows, 0, cols)
}

function parseSheet(data: Uint8Array): DraftExpense[] {
  const wb = XLSX.read(data, { type: 'array', cellDates: false })
  const drafts: DraftExpense[] = []

  // Try every sheet (some statements put transactions on a later tab).
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: '',
    })
    if (rows.length < 2) continue

    // Scan the first rows for the best header row (statements often have
    // several preamble rows before the transaction table).
    let headerIdx = -1
    let bestCols: Columns | null = null
    let bestScore = 0
    const scanLimit = Math.min(rows.length, 30)
    for (let i = 0; i < scanLimit; i++) {
      const hdr = rows[i].map((h) => String(h ?? ''))
      const cols = findColumns(hdr)
      const score = columnScore(cols)
      if (isUsableHeader(cols) && score > bestScore) {
        bestScore = score
        headerIdx = i
        bestCols = cols
      }
    }

    if (headerIdx >= 0 && bestCols) {
      const found = rowsToDrafts(rows, headerIdx + 1, bestCols)
      if (found.length) return found
    }

    // No usable header on this sheet — try content-based detection.
    const byContent = parseByContent(rows)
    if (byContent.length) return byContent
  }

  return drafts
}

function makeDraft(
  key: number,
  amount: number,
  isDebit: boolean,
  date: string | null,
  desc: string,
): DraftExpense {
  const description = desc || (isDebit ? 'Expense' : 'Income')
  return {
    key,
    amount: amount.toFixed(2),
    category: isDebit ? inferCategory(description) : 'Other',
    description,
    payment_method: isDebit ? 'Bank Transfer' : 'Bank Transfer',
    spent_on: date ?? todayFallback(),
    isDebit,
  }
}

function todayFallback(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

// --- PDF ---------------------------------------------------------------------

const DATE_RE = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/
// Amount like 1,234.50 or (1,234.50) for negatives
const AMOUNT_RE = /[-+]?\(?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})\)?|\d+(?:\.\d{1,2})?/

/** Thrown when a file (PDF or Excel) is encrypted and needs a password
 *  (or the one supplied is wrong). */
export class StatementPasswordError extends Error {
  /** true if a password was supplied but rejected */
  wrongPassword: boolean
  constructor(wrongPassword: boolean) {
    super(
      wrongPassword
        ? 'The password is incorrect. Please try again.'
        : 'This file is password protected. Please enter its password.',
    )
    this.name = 'StatementPasswordError'
    this.wrongPassword = wrongPassword
  }
}

/** @deprecated use StatementPasswordError */
export const PdfPasswordError = StatementPasswordError

async function extractPdfText(
  data: ArrayBuffer,
  password?: string,
): Promise<string> {
  const task = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    password: password || undefined,
  })
  let pdf
  try {
    pdf = await task.promise
  } catch (err: unknown) {
    // pdf.js raises a PasswordException for encrypted files.
    // code 1 = password needed, code 2 = password incorrect.
    const e = err as { name?: string; code?: number }
    if (e?.name === 'PasswordException') {
      throw new StatementPasswordError(e.code === 2)
    }
    throw err
  }

  let text = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    text +=
      content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n'
  }
  return text
}

function parsePdfText(text: string): DraftExpense[] {
  const lines = text.split(/\r?\n/)
  const drafts: DraftExpense[] = []
  let key = 0
  for (const line of lines) {
    const dateMatch = line.match(DATE_RE)
    if (!dateMatch) continue
    const date = parseDateCell(dateMatch[1])
    if (!date) continue

    const amounts = [
      ...line.matchAll(/[-+]?\(?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})\)?|\d+(?:\.\d{1,2})?/g),
    ]
      .map((m) => m[0])
      .filter((a) => !/^\d{1,2}[-/]\d{1,2}[-/]/.test(a)) // not the date
      .map((a) => {
        const neg = a.startsWith('(') && a.endsWith(')')
        const n = parseAmount(a)
        return n == null ? null : neg ? -n : n
      })
      .filter((n): n is number => n != null && n !== 0)
    if (amounts.length === 0) continue

    // Use the last (largest) amount on the line as the transaction value
    const value = amounts[amounts.length - 1]
    const norm = normalizeAmount(value)
    if (!norm) continue

    const desc = line
      .replace(DATE_RE, '')
      .replace(AMOUNT_RE, '')
      .replace(/[-/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120)

    drafts.push(
      makeDraft(
        key++,
        norm.amount,
        norm.isDebit,
        date,
        desc || (norm.isDebit ? 'Expense' : 'Income'),
      ),
    )
  }
  return drafts
}

// --- public API --------------------------------------------------------------

/** Pick a parse strategy from the file name/type. CSV is handled by the
 *  spreadsheet reader, which auto-detects the delimiter. */
export function detectFormat(file: File): StatementFormat {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  // .csv, .xls, .xlsx and anything else fall through to the sheet reader
  return 'excel'
}

/** Decrypt a password-protected .xls/.xlsx if needed, returning readable bytes.
 *  CSV and unprotected spreadsheets pass through unchanged. */
async function readSheetBytes(
  buffer: ArrayBuffer,
  password?: string,
): Promise<Uint8Array> {
  const buf = Buffer.from(buffer)
  let encrypted = false
  try {
    encrypted = isEncrypted(buf)
  } catch {
    // Not an Office container (e.g. CSV) — treat as not encrypted.
    encrypted = false
  }
  if (!encrypted) return new Uint8Array(buffer)

  if (!password) throw new StatementPasswordError(false)
  try {
    const decrypted = await decrypt(buf, { password })
    return new Uint8Array(decrypted)
  } catch (err) {
    if (err instanceof StatementPasswordError) throw err
    // officecrypto-tool throws a generic error on a wrong password.
    throw new StatementPasswordError(true)
  }
}

export async function parseStatement(
  file: File,
  options?: { format?: StatementFormat; password?: string },
): Promise<DraftExpense[]> {
  const resolved = options?.format ?? detectFormat(file)
  const buffer = await file.arrayBuffer()
  if (resolved === 'pdf') {
    const text = await extractPdfText(buffer, options?.password)
    return parsePdfText(text)
  }
  const bytes = await readSheetBytes(buffer, options?.password)
  return parseSheet(bytes)
}
