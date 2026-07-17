/**
 * Category-driven form configuration.
 *
 * Each category defines the set of fields shown in the Add/Edit form. Fields
 * marked `core: true` map to first-class columns on the backend VaultEntry
 * (title, username, password, url, totp_secret, notes). All other fields are
 * stored in the JSON `custom_fields` column.
 */

export type FieldType = 'text' | 'password' | 'email' | 'url' | 'month' | 'textarea'

export interface FieldDef {
  /** key used in form state; for core fields this is the backend column name */
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  /** true = maps to a first-class VaultEntry column, false/undefined = custom_fields */
  core?: boolean
  /** treat value as a secret: masked in display with show/copy */
  secret?: boolean
}

export interface CategoryDef {
  /** value stored in VaultEntry.category */
  value: string
  label: string
  /** lucide-react icon name */
  icon: string
  fields: FieldDef[]
}

// Reusable core field builders -------------------------------------------------

const titleField = (label = 'Title', placeholder = 'e.g. GitHub'): FieldDef => ({
  key: 'title',
  label,
  type: 'text',
  required: true,
  core: true,
  placeholder,
})

const notesField: FieldDef = {
  key: 'notes',
  label: 'Notes',
  type: 'textarea',
  core: true,
  placeholder: 'Any extra details...',
}

// Category definitions ---------------------------------------------------------

export const CATEGORIES: CategoryDef[] = [
  {
    value: 'Login',
    label: 'Login',
    icon: 'LogIn',
    fields: [
      titleField('Title', 'e.g. Personal site'),
      { key: 'username', label: 'Username / email', type: 'text', required: true, core: true, placeholder: 'you@example.com' },
      { key: 'password', label: 'Password', type: 'password', required: true, core: true, secret: true },
      { key: 'url', label: 'Website URL', type: 'url', core: true, placeholder: 'https://example.com' },
      { key: 'totp_secret', label: 'TOTP secret', type: 'text', core: true, secret: true, placeholder: 'ABCD...' },
      notesField,
    ],
  },
  {
    value: 'ATM',
    label: 'ATM',
    icon: 'CreditCard',
    fields: [
      titleField('Title', 'e.g. HDFC ATM Card'),
      { key: 'bank_name', label: 'Bank name', type: 'text', required: true, placeholder: 'e.g. HDFC Bank' },
      { key: 'account_holder', label: 'Account holder', type: 'text', placeholder: 'Name on the account' },
      { key: 'account_number', label: 'Account number', type: 'text', secret: true, placeholder: 'e.g. 1234567890' },
      { key: 'card_number', label: 'Card number', type: 'text', secret: true, placeholder: '#### #### #### ####' },
      { key: 'atm_pin', label: 'ATM PIN', type: 'password', required: true, secret: true, placeholder: '4–6 digit PIN' },
      { key: 'cvv', label: 'CVV', type: 'password', secret: true, placeholder: '3 digits' },
      { key: 'expiry_date', label: 'Expiry date', type: 'month', placeholder: 'MM/YYYY' },
      notesField,
    ],
  },
  {
    value: 'Credit Card',
    label: 'Credit Card',
    icon: 'CreditCard',
    fields: [
      titleField('Title', 'e.g. Amex Platinum'),
      { key: 'bank_name', label: 'Issuing bank', type: 'text', placeholder: 'e.g. American Express' },
      { key: 'cardholder', label: 'Cardholder name', type: 'text', placeholder: 'Name on the card' },
      { key: 'card_number', label: 'Card number', type: 'text', required: true, secret: true, placeholder: '#### #### #### ####' },
      { key: 'cvv', label: 'CVV', type: 'password', required: true, secret: true, placeholder: '3–4 digits' },
      { key: 'expiry_date', label: 'Expiry date', type: 'month', required: true, placeholder: 'MM/YYYY' },
      { key: 'pin', label: 'PIN', type: 'password', secret: true, placeholder: 'Card PIN' },
      notesField,
    ],
  },
  {
    value: 'Bank',
    label: 'Bank Account',
    icon: 'Landmark',
    fields: [
      titleField('Title', 'e.g. Savings Account'),
      { key: 'bank_name', label: 'Bank name', type: 'text', required: true, placeholder: 'e.g. Chase' },
      { key: 'account_holder', label: 'Account holder', type: 'text', placeholder: 'Name on the account' },
      { key: 'account_number', label: 'Account number', type: 'text', required: true, secret: true, placeholder: 'e.g. 1234567890' },
      { key: 'routing_number', label: 'Routing / IFSC', type: 'text', placeholder: 'e.g. HDFC0001234' },
      { key: 'ifsc_swift', label: 'SWIFT / BIC', type: 'text', placeholder: 'For international transfers' },
      { key: 'net_banking_user', label: 'Net banking username', type: 'text' },
      { key: 'net_banking_password', label: 'Net banking password', type: 'password', secret: true },
      notesField,
    ],
  },
  {
    value: 'Email',
    label: 'Email',
    icon: 'Mail',
    fields: [
      titleField('Title', 'e.g. Work Gmail'),
      { key: 'username', label: 'Email address', type: 'email', required: true, core: true, placeholder: 'you@example.com' },
      { key: 'password', label: 'Password', type: 'password', required: true, core: true, secret: true },
      { key: 'url', label: 'Provider URL', type: 'url', core: true, placeholder: 'https://mail.google.com' },
      { key: 'recovery_email', label: 'Recovery email', type: 'email', placeholder: 'backup@example.com' },
      { key: 'totp_secret', label: 'TOTP secret', type: 'text', core: true, secret: true },
      notesField,
    ],
  },
  {
    value: 'Social',
    label: 'Social Media',
    icon: 'Share2',
    fields: [
      titleField('Title', 'e.g. Instagram'),
      { key: 'username', label: 'Username / handle', type: 'text', required: true, core: true, placeholder: '@handle' },
      { key: 'password', label: 'Password', type: 'password', required: true, core: true, secret: true },
      { key: 'url', label: 'Profile URL', type: 'url', core: true, placeholder: 'https://...' },
      { key: 'recovery_phone', label: 'Recovery phone', type: 'text', placeholder: '+1 555 0100' },
      notesField,
    ],
  },
  {
    value: 'WiFi',
    label: 'Wi-Fi',
    icon: 'Wifi',
    fields: [
      titleField('Title', 'e.g. Home Network'),
      { key: 'ssid', label: 'Network name (SSID)', type: 'text', required: true, placeholder: 'MyNetwork' },
      { key: 'password', label: 'Wi-Fi password', type: 'password', required: true, core: true, secret: true },
      { key: 'security', label: 'Security type', type: 'text', placeholder: 'WPA2 / WPA3' },
      notesField,
    ],
  },
  {
    value: 'API Key',
    label: 'API Key',
    icon: 'KeySquare',
    fields: [
      titleField('Title', 'e.g. Stripe live key'),
      { key: 'username', label: 'Key name / ID', type: 'text', core: true, placeholder: 'e.g. sk_live_id' },
      { key: 'password', label: 'Secret key', type: 'password', required: true, core: true, secret: true },
      { key: 'url', label: 'API endpoint', type: 'url', core: true, placeholder: 'https://api.example.com' },
      { key: 'environment', label: 'Environment', type: 'text', placeholder: 'production / sandbox' },
      notesField,
    ],
  },
  {
    value: 'Secure Note',
    label: 'Secure Note',
    icon: 'StickyNote',
    fields: [
      titleField('Title', 'e.g. Passport details'),
      { key: 'notes', label: 'Content', type: 'textarea', required: true, core: true, placeholder: 'Sensitive text...' },
    ],
  },
  {
    value: 'Other',
    label: 'Other',
    icon: 'Shield',
    fields: [
      titleField('Title'),
      { key: 'username', label: 'Username', type: 'text', core: true },
      { key: 'password', label: 'Password', type: 'password', core: true, secret: true },
      { key: 'url', label: 'URL', type: 'url', core: true },
      notesField,
    ],
  },
]

export const CORE_KEYS = [
  'title',
  'username',
  'password',
  'url',
  'totp_secret',
  'notes',
] as const

export function getCategory(value: string): CategoryDef {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0]
}

/** Human-readable label for a custom_fields key (fallback when category unknown). */
export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
