import { useAction, useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import {
  fetchSearchResults,
  isSearchOpenAtom,
  MIN_QUERY_LENGTH,
  openSearch,
  searchQueryAtom,
} from '../model'

// Mirrors the search debounce in `useDebouncedSearch`, so the URL updates on the
// same cadence as the results. Uses `replace` (never `push`) — no history spam.
const URL_SYNC_DEBOUNCE_MS = 400

/**
 * Web-only: keeps `?search=<query>` on `/listen` in sync with the search state.
 * A deep-linked `?search=` (>= MIN_QUERY_LENGTH) seeds the search mode and
 * fetches results; afterwards the query is mirrored back into the URL with a
 * debounced `router.replace`, and stripped when the search is cleared. Native is
 * a no-op. A ref guard prevents the seed and the URL write from looping.
 */
export const useSearchUrlSync = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{ search?: string }>()
  const [query, setQuery] = useAtom(searchQueryAtom)
  const [isOpen] = useAtom(isSearchOpenAtom)
  const open = useAction(openSearch)
  const fetchResults = useAction(fetchSearchResults)
  const lastSyncedRef = useRef<null | string>(null)
  const isFirstSyncRef = useRef(true)

  const incoming = typeof params.search === 'string' ? params.search.trim() : ''

  // Seed the search mode from a deep link; skip our own URL writes.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    if (isOpen) return
    if (incoming.length < MIN_QUERY_LENGTH) return
    if (incoming === lastSyncedRef.current) return

    lastSyncedRef.current = incoming
    setQuery(incoming)
    void open()
    void fetchResults(incoming)
  }, [incoming, isOpen, setQuery, open, fetchResults])

  // Mirror the query back into the URL. The first run only adopts the incoming
  // param, so mounting `/listen` without a query does not rewrite the URL.
  useEffect(() => {
    if (Platform.OS !== 'web') return

    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false
      lastSyncedRef.current = incoming
      return
    }

    const next = query.trim()
    if (next === lastSyncedRef.current) return

    const timer = setTimeout(() => {
      lastSyncedRef.current = next
      router.replace(
        next ? { params: { search: next }, pathname: '/listen' } : { pathname: '/listen' },
      )
    }, URL_SYNC_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [incoming, query, router])
}
