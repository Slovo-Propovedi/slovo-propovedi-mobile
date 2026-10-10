import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { fetchMyFeatureFlags } from '../model'

/**
 * Refetches feature flags whenever the app returns to the foreground. Covers the
 * two cases the startup-only fetch misses: a transient network failure at launch
 * and a token that appeared after startup (post-login). The token guard lives
 * inside `fetchMyFeatureFlags`, so an anonymous foreground is a silent no-op.
 */
export const useFeatureFlagsRefetchOnForeground = (): void => {
  const refetch = useAction(fetchMyFeatureFlags)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState !== 'active') return

      void refetch()
    })

    return () => subscription.remove()
  }, [refetch])
}
