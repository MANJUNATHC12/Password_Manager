export const DOC_TYPES = [
  'Aadhaar',
  'PAN',
  'Passport',
  'Driver’s License',
  'Voter ID',
  'Other',
] as const

export type DocType = (typeof DOC_TYPES)[number]
