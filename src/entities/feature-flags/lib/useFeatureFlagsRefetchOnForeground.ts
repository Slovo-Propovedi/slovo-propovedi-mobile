import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { fetchMyFeatureFlags } from '../model'

/**
 * Refetches feature flags whenever the app returns to the foreground. Covers the
 * cases the startup-only fetch misses: a transient network failure at launch and
 * a token that appeared after startup (post-login). Anonymous foregrounds also
 * refetch, picking up the latest global flag state.
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
