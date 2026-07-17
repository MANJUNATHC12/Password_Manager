import type { AxiosError } from 'axios'

interface ErrorDetail {
  detail?: string | { msg?: string } | Array<{ msg?: string }>
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const err = error as AxiosError<ErrorDetail>
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail.find((d) => d?.msg)
      if (first?.msg) return first.msg
    }
    if (detail && typeof detail === 'object' && 'msg' in detail && detail.msg) {
      return detail.msg
    }
  }
  if (error instanceof Error) return error.message
  return fallback
}
