import { useCallback, useEffect, useState } from 'react'
import { getExpiringExpenses } from '@/services/expenses'
import type { ExpiringExpense } from '@/types'

/**
 * Fetches expenses expiring / due within `days` (default 5), including recently
 * expired ones. Refreshes automatically whenever an `expenses:changed` event
 * is dispatched (after create/update/delete), keeping the sidebar badge and
 * page banner always in sync.
 */
export function useExpiringExpenses(days = 5) {
  const [items, setItems] = useState<ExpiringExpense[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    getExpiringExpenses(days)
      .then((res) => setItems(res.entries))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener('expenses:changed', onChange)
    return () => window.removeEventListener('expenses:changed', onChange)
  }, [refresh])

  return { items, count: items.length, loading, refresh }
}
