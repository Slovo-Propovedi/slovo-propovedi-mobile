import { action, atom } from '@reatom/framework'
import { PLAYER_SIZES } from '../theme/themed'

/** Conservative starting value until the derived tab bar height is published in the first layout commit. */
export const tabBarHeightAtom = atom<number>(PLAYER_SIZES.tabBarHeight, 'tabBarHeightAtom')

/** Set once the derived tab bar height has been published (kept for consumers that gate on the first commit). */
export const isTabBarMeasuredAtom = atom<boolean>(false, 'isTabBarMeasuredAtom')

export const setTabBarHeight = action((ctx, height: number) => {
  isTabBarMeasuredAtom(ctx, true)

  const prev = ctx.get(tabBarHeightAtom)
  if (prev === height) return

  tabBarHeightAtom(ctx, height)
}, 'setTabBarHeight')

/** True while the floating bottom bar (mini player above the tab bar) is collapsed to one line. */
export const isBarCollapsedAtom = atom<boolean>(false, 'isBarCollapsedAtom')

export const setBarCollapsed = action((ctx, isCollapsed: boolean) => {
  if (ctx.get(isBarCollapsedAtom) === isCollapsed) return

  isBarCollapsedAtom(ctx, isCollapsed)
}, 'setBarCollapsed')
