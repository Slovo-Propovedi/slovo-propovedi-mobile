import { useAtom } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { isOnlineAtom } from 'shared/model'
import { RETRY_INTERVAL_CACHED_MS, RETRY_INTERVAL_NO_DATA_MS } from './constants'

interface UseOfflineRetryOptions {
  /** Function to call on each retry attempt. */
  fetchFn: () => Promise<void> | void
  /** Whether cached data is currently shown (determines retry interval: 30s if true, 5s if false). */
  hasCachedData: boolean
  /** Whether a fetch is currently in progress (skips retry to avoid duplicate concurrent fetches). */
  isLoading: boolean
  /** Whether data needs to be re-fetched (true when last fetch didn't get data from network). */
  needsRetry: boolean
}

export const useOfflineRetry = ({
  fetchFn,
  hasCachedData,
  isLoading,
  needsRetry,
}: UseOfflineRetryOptions) => {
  const [isOnline] = useAtom(isOnlineAtom)
  const [isAppActive, setIsAppActive] = useState(true)

  // Refs to avoid stale closures inside intervals and event listeners
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn
  const needsRetryRef = useRef(needsRetry)
  needsRetryRef.current = needsRetry
  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading

  // Synchronous in-flight guard — doesn't depend on deferred atom updates
  const inflightRef = useRef(false)
  const safeFetchRef = useRef<() => void>(() => {})
  safeFetchRef.current = () => {
    if (inflightRef.current) return
    inflightRef.current = true
    Promise.resolve(fetchFnRef.current())
      .catch(error => console.error('Retry fetch failed:', error))
      .finally(() => {
        inflightRef.current = false
      })
  }

  // Track app foreground/background — retry immediately when returning to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const active = nextAppState === 'active'
      setIsAppActive(active)
      if (active && needsRetryRef.current && !isLoadingRef.current) safeFetchRef.current()
    })
    return () => subscription.remove()
  }, [])

  // Immediate retry when connectivity is restored (primary mechanism — survives Doze mode)
  const prevOnlineRef = useRef(isOnline)
  useEffect(() => {
    if (isOnline && !prevOnlineRef.current && needsRetryRef.current && !isLoadingRef.current)
      safeFetchRef.current()
    prevOnlineRef.current = isOnline
  }, [isOnline])

  // Fixed-interval polling as safety net (foreground only, skips if loading)
  useEffect(() => {
    if (!needsRetry || !isAppActive) return

    const interval = hasCachedData ? RETRY_INTERVAL_CACHED_MS : RETRY_INTERVAL_NO_DATA_MS

    const id = setInterval(() => {
      if (!isLoadingRef.current) safeFetchRef.current()
    }, interval)

    return () => clearInterval(id)
  }, [hasCachedData, isAppActive, needsRetry])
}
