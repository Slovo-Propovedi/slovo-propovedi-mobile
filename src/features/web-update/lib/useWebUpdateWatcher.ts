import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { applyWebUpdate } from './applyWebUpdate'

export type WebUpdateStatus = 'idle' | 'installing' | 'ready'

export interface WebUpdateWatcherState {
  apply: () => void
  applying: boolean
  dismiss: () => void
  status: WebUpdateStatus
}

const UPDATE_INTERVAL_MS = 60 * 60 * 1000
const VISIBILITY_THROTTLE_MS = 5 * 60 * 1000

const noop = () => {}

export const useWebUpdateWatcher = (): WebUpdateWatcherState => {
  const [status, setStatus] = useState<WebUpdateStatus>('idle')
  const [applying, setApplying] = useState(false)
  const dismissedRef = useRef(false)

  const isWebSupported =
    Platform.OS === 'web' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator

  useEffect(() => {
    if (!isWebSupported) return

    let cancelled = false
    let cleanup: (() => void) | undefined
    let lastVisibilityCheck = 0

    const checkWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting && navigator.serviceWorker.controller && !dismissedRef.current)
        setStatus('ready')
    }

    const attachStateChange = (reg: ServiceWorkerRegistration) => {
      const worker = reg.installing
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (
          worker.state === 'installed' &&
          navigator.serviceWorker.controller &&
          !dismissedRef.current
        )
          setStatus('ready')
        else if (worker.state === 'redundant') setStatus('idle')
      })
    }

    const handleUpdateFound = (reg: ServiceWorkerRegistration) => {
      dismissedRef.current = false
      setStatus('installing')
      attachStateChange(reg)
    }

    const runUpdateCheck = (reg: ServiceWorkerRegistration) => {
      reg
        .update()
        .catch(noop)
        .then(() => checkWaiting(reg))
    }

    void navigator.serviceWorker.ready.then(reg => {
      if (cancelled) return

      if (reg.waiting && navigator.serviceWorker.controller && !dismissedRef.current)
        setStatus('ready')
      else if (reg.installing) {
        setStatus('installing')
        attachStateChange(reg)
      }

      const onUpdateFound = () => handleUpdateFound(reg)
      reg.addEventListener('updatefound', onUpdateFound)

      const intervalId = setInterval(() => runUpdateCheck(reg), UPDATE_INTERVAL_MS)
      const onOnline = () => runUpdateCheck(reg)
      const onVisibilityChange = () => {
        const now = Date.now()
        if (
          document.visibilityState === 'visible' &&
          now - lastVisibilityCheck >= VISIBILITY_THROTTLE_MS
        ) {
          lastVisibilityCheck = now
          runUpdateCheck(reg)
        }
      }

      window.addEventListener('online', onOnline)
      document.addEventListener('visibilitychange', onVisibilityChange)

      cleanup = () => {
        clearInterval(intervalId)
        reg.removeEventListener('updatefound', onUpdateFound)
        window.removeEventListener('online', onOnline)
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [isWebSupported])

  const dismiss = useCallback(() => {
    dismissedRef.current = true
    setStatus('idle')
  }, [])

  const apply = useCallback(() => {
    setApplying(true)
    void applyWebUpdate()
  }, [])

  return { apply, applying, dismiss, status }
}
