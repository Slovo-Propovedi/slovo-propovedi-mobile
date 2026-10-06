import { useAction } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import { loadMyPlaylists, loadSectionSettings } from 'entities/playlist'
import { fetchAllSections } from 'entities/section'
import { REFRESH_MIN_INTERVAL_MS } from 'shared/ui'

/**
 * Pull-to-refresh for the listen screen: reloads dynamic sections, local
 * playlists and section settings together. Rapid repeated pulls are ignored —
 * an in-flight refresh is a no-op, and a second pull within
 * `REFRESH_MIN_INTERVAL_MS` never even starts — so a stray gesture cannot
 * hammer the server. `fetchAllSections` is cache-first (stale-while-revalidate),
 * so a pull is safe even offline.
 * @returns `isRefreshing` for the spinner and `refresh` as the `onRefresh` handler.
 */
export const usePullToRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const lastRefreshAtRef = useRef(0)
  const inFlightRef = useRef(false)

  const fetchSections = useAction(fetchAllSections)
  const loadPlaylists = useAction(loadMyPlaylists)
  const loadSettings = useAction(loadSectionSettings)

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    if (Date.now() - lastRefreshAtRef.current < REFRESH_MIN_INTERVAL_MS) return

    inFlightRef.current = true
    lastRefreshAtRef.current = Date.now()
    setIsRefreshing(true)
    try {
      await Promise.all([fetchSections(), loadPlaylists(), loadSettings()])
    } finally {
      inFlightRef.current = false
      setIsRefreshing(false)
    }
  }, [fetchSections, loadPlaylists, loadSettings])

  return { isRefreshing, refresh }
}
