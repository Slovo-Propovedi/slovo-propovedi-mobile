import { action, atom } from '@reatom/framework'
import { PLAYER_SIZES } from 'shared/ui/theme'

/** Approximation used only until the real tab bar height is measured via onLayout. */
export const tabBarHeightAtom = atom<number>(PLAYER_SIZES.tabBarHeight, 'tabBarHeightAtom')

export const setTabBarHeight = action((ctx, height: number) => {
  if (ctx.get(tabBarHeightAtom) === height) return

  tabBarHeightAtom(ctx, height)
}, 'setTabBarHeight')
