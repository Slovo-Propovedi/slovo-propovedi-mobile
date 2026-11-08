import { type PropsWithChildren } from 'react'
import { BlurTargetContext } from './blurTargetContext'
import { useActiveBlurTarget } from './useActiveBlurTarget'

/**
 * Publishes the active page's blur target to every glass surface below it.
 * Mounted above the tab navigator, so both the tab bar and the player/search
 * overlays (siblings of the navigator) resolve the same backdrop.
 * @param root0 - Provider props.
 * @param root0.children - Tab shell content that renders glass surfaces.
 */
export const BlurTargetProvider = ({ children }: PropsWithChildren) => {
  const blurTarget = useActiveBlurTarget()

  return <BlurTargetContext.Provider value={blurTarget}>{children}</BlurTargetContext.Provider>
}
