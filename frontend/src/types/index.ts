export interface User {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface VaultEntry {
  id: string
  title: string
  username: string | null
  password: string | null
  url: string | null
  totp_secret: string | null
  category: string
  notes: string | null
  custom_fields: Record<string, string> | null
  iv: string
  created_at: string
  updated_at: string
}

export interface VaultEntryList {
  entries: VaultEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface VaultEntryInput {
  title: string
  username?: string | null
  password?: string | null
  url?: string | null
  totp_secret?: string | null
  category?: string
  notes?: string | null
  custom_fields?: Record<string, string> | null
}

export interface DocumentEntry {
  id: string
  doc_type: string
  doc_number: string | null
  holder_name: string | null
  issue_date: string | null
  expiry_date: string | null
  notes: string | null
  has_file: boolean
  file_name: string | null
  file_type: string | null
  created_at: string
  updated_at: string
}

export interface DocumentList {
  entries: DocumentEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface Expense {
  id: string
  amount: number
  category: string
  description: string | null
  payment_method: string | null
  spent_on: string // YYYY-MM-DD
  created_at: string
  updated_at: string
}

export interface ExpenseList {
  entries: Expense[]
  total: number
  total_amount: number
  page: number
  page_size: number
  total_pages: number
}

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
}

export interface ExpenseSummary {
  month: string
  total: number
  count: number
  by_category: CategoryBreakdown[]
}

export interface ExpenseForm {
  amount: string
  category: string
  description: string
  payment_method: string
  spent_on: string
}

export interface ExpiringDocument {
  id: string
  doc_type: string
  doc_number: string | null
  holder_name: string | null
  expiry_date: string
  days_until_expiry: number
  expired: boolean
}

export interface ExpiringDocumentList {
  entries: ExpiringDocument[]
  total: number
  days: number
}

export interface DocumentForm {
  doc_type: string
  doc_number: string
  holder_name: string
  issue_date: string
  expiry_date: string
  notes: string
  file: File | null
}

// ─── Grocery ──────────────────────────────────────────────────

export interface GroceryItem {
  id: string
  month: string // YYYY-MM
  name: string
  quantity: number
  unit: string
  category: string
  estimated_price: number | null
  is_purchased: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GroceryList {
  items: GroceryItem[]
  total: number
  purchased_count: number
  remaining_count: number
  estimated_total: number
}

export interface GroceryCategoryBreakdown {
  category: string
  total: number
  count: number
  purchased: number
}

export interface GrocerySummary {
  month: string
  total: number
  purchased: number
  remaining: number
  estimated_total: number
  by_category: GroceryCategoryBreakdown[]
}

export interface GroceryForm {
  name: string
  quantity: string
  unit: string
  category: string
  estimated_price: string
  notes: string
}

