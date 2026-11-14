import { useCtx } from '@reatom/npm-react'
import { useNavigation } from 'expo-router'
import { useEffect } from 'react'
import { isScreenTransitioningAtom } from '../model/screenTransition'

// Expo Router's navigation type exposes only the core events; the native stack
// emits `transitionEnd`, so narrow the hook return to the slice the hook uses.
interface TransitionEndNavigation {
  addListener: (event: 'transitionEnd', listener: () => void) => () => void
}

/**
 * Clears the optimistic screen-transition flag once a pushed detail screen
 * settles. Mounted by the detail screens themselves: a layout's navigation
 * belongs to its parent navigator and never sees nested stack pushes.
 * The unmount cleanup also clears the flag, so an interrupted pop that skips
 * `transitionEnd` cannot leave the search overlay concealed forever.
 */
export const useScreenTransitionTracking = () => {
  const ctx = useCtx()
  const navigation = useNavigation<TransitionEndNavigation>()

  useEffect(() => {
    const unsubscribe = navigation.addListener('transitionEnd', () => {
      isScreenTransitioningAtom(ctx, false)
    })

    return () => {
      unsubscribe()
      isScreenTransitioningAtom(ctx, false)
    }
  }, [ctx, navigation])
}
