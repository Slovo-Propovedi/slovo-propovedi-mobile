import { useLayoutEffectSharedValue } from 'shared/lib/hooks/useLayoutEffectSharedValue'

/**
 * UI-thread mirror of the measured tab-row height.
 *
 * The width/height of the row changes after mount on a channel the player cannot
 * see in the same commit (the row measures on its first layout pass), and a
 * worklet-closure update alone can be dropped during busy startup windows
 * (Issue #63), so it goes through the pre-paint shared-value channel. Window
 * dimensions use the same hook: they are committed in the layout phase, so the
 * animated layer lands in the same commit as the rotated window.
 * @param tabBarHeight - Measured height of the floating tab row.
 */
export const useTabBarHeightShared = (tabBarHeight: number) =>
  useLayoutEffectSharedValue(tabBarHeight)
