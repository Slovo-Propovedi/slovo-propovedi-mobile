import { useWindowDimensions } from 'react-native'
import { getIsWideLayoutSync } from './getIsWideLayoutSync'

/**
 * True at tablet/desktop windows: the wide layout needs a tablet-class shortest
 * side (600) as well as a tablet-class width (768), so a phone in landscape
 * (844×390) never enters the wide layout. Delegates to `getIsWideLayoutSync`, the
 * same predicate the player's worklets evaluate against their shared window
 * values, so the React and animated layers cannot drift apart.
 */
export const useIsWideLayout = (): boolean => {
  const { height, width } = useWindowDimensions()

  return getIsWideLayoutSync(width, height)
}
