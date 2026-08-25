import { action, atom } from '@reatom/framework'
import { PLAYER_SIZES } from 'shared/ui/theme'

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
