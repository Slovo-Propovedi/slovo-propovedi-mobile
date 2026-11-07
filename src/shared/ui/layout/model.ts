import { action, atom } from '@reatom/framework'
import { PLAYER_SIZES } from '../theme/themed'

/** Approximation used only until the real tab bar height is measured via onLayout. */
export const tabBarHeightAtom = atom<number>(PLAYER_SIZES.tabBarHeight, 'tabBarHeightAtom')

/** Set to true the first time CustomTabBar reports its real height. */
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
