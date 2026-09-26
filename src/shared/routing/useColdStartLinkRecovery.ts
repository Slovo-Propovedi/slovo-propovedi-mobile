import { usePathname, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Linking, Platform } from 'react-native'
import { extractLaunchPath, shouldAttemptRecovery } from './launchPath'

const RECOVERY_DELAY_MS = 1000
const RECOVERY_FAILED_MESSAGE = 'cold-start link recovery failed:'

// Survives Fast Refresh and StrictMode remounts so a single launch never
// replays the deep link twice.
let recoveryAttempted = false

/**
 * Replays the Android launch deep link when expo-router loses it to its 150 ms
 * initial-URL race, leaving the app on the redirect fallback route.
 */
export const useColdStartLinkRecovery = () => {
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (Platform.OS !== 'android') return

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const url = await Linking.getInitialURL()
          const launchPath = extractLaunchPath(url ?? '')

          if (launchPath === null) return
          if (recoveryAttempted) return
          if (!shouldAttemptRecovery(pathnameRef.current, launchPath)) return

          recoveryAttempted = true
          router.push(launchPath)
        } catch (error) {
          console.error(RECOVERY_FAILED_MESSAGE, error)
        }
      })()
    }, RECOVERY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [router])
}
