import { useCallback, useEffect, useState } from 'react'
import { getExpiringDocuments } from '@/services/documents'
import type { ExpiringDocument } from '@/types'

/**
 * Fetches documents expiring within `days` (default 10), including already
 * expired ones. Refreshes automatically whenever a `documents:changed` event
 * is dispatched (after create/update/delete), so the navbar badge and the
 * page banner stay in sync.
 */
export function useExpiringDocuments(days = 10) {
  const [items, setItems] = useState<ExpiringDocument[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    getExpiringDocuments(days)
      .then((res) => setItems(res.entries))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener('documents:changed', onChange)
    return () => window.removeEventListener('documents:changed', onChange)
  }, [refresh])

  return { items, count: items.length, loading, refresh }
}
