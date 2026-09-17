import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'

/**
 * Stable callback that sets the header title via navigation.setOptions.
 * Mount-safe: no-op before mount and after unmount (guards late callbacks
 * scheduled via scheduleOnRN from worklets).
 */
export const useHeaderTitle = () => {
  const navigation = useNavigation()
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const setHeaderTitle = useCallback(
    (title: string) => {
      if (!isMountedRef.current) return
      navigation.setOptions({ headerTitle: title })
    },
    [navigation],
  )

  return setHeaderTitle
}
