import { useAction, useAtom } from '@reatom/npm-react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { isSearchOpenAtom, MIN_QUERY_LENGTH, searchQueryAtom } from '../model'
import { openSearch } from '../model-session'

// Mirrors the search-page debounce, so the URL updates on the same cadence as
// the results. Uses `replace` (never `push`) — no history spam.
const URL_SYNC_DEBOUNCE_MS = 400

/**
 * Web-only: keeps `?search=<query>` on `/listen` in sync with the search state.
 * A deep-linked `?search=` (>= MIN_QUERY_LENGTH) seeds the search mode and the
 * query (the page owns fetching); afterwards the query is mirrored back into the URL with a
 * debounced `router.setParams`, and stripped when the search is cleared. Native
 * is a no-op. A ref guard prevents the seed and the URL write from looping.
 *
 * `setParams` (not `replace`): the listen stack's REPLACE mints a new route key,
 * which remounts ListenScreen and destroys the focused TextInput mid-typing.
 * Updating the current route's params keeps the screen (and the caret) alive;
 * expo-router still projects the new params into the browser URL.
 */
export const useSearchUrlSync = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{ search?: string }>()
  const [query, setQuery] = useAtom(searchQueryAtom)
  const [isOpen] = useAtom(isSearchOpenAtom)
  const open = useAction(openSearch)
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
  }, [incoming, isOpen, setQuery, open])

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
      // Params update in place; `replace` would re-key the listen stack route
      // and remount the screen, blurring the field the user is typing into.
      router.setParams({ search: next || undefined })
    }, URL_SYNC_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [incoming, query, router])
}
