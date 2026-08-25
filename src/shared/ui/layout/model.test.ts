import { createCtx } from '@reatom/framework'
import { PLAYER_SIZES } from 'shared/ui/theme'
import { isTabBarMeasuredAtom, setTabBarHeight, tabBarHeightAtom } from './model'

describe('tabBarHeight model', () => {
  test('atom starts with the fallback approximation', () => {
    const ctx = createCtx()

    expect(ctx.get(tabBarHeightAtom)).toBe(PLAYER_SIZES.tabBarHeight)
  })

  test('setTabBarHeight updates the atom', () => {
    const ctx = createCtx()

    setTabBarHeight(ctx, 120)

    expect(ctx.get(tabBarHeightAtom)).toBe(120)
  })

  test('setting the same value does not notify subscribers again', () => {
    const ctx = createCtx()
    let changeCount = 0
    ctx.subscribe(tabBarHeightAtom, () => {
      changeCount += 1
    })

    setTabBarHeight(ctx, 120)
    setTabBarHeight(ctx, 120)

    // 1 initial subscription call + 1 real change; duplicate write is skipped
    expect(changeCount).toBe(2)
  })
})

describe('isTabBarMeasuredAtom', () => {
  test('starts as false', () => {
    const ctx = createCtx()

    expect(ctx.get(isTabBarMeasuredAtom)).toBe(false)
  })

  test('flips to true on setTabBarHeight even when value equals the initial guess', () => {
    const ctx = createCtx()

    setTabBarHeight(ctx, PLAYER_SIZES.tabBarHeight)

    expect(ctx.get(isTabBarMeasuredAtom)).toBe(true)
    expect(ctx.get(tabBarHeightAtom)).toBe(PLAYER_SIZES.tabBarHeight)
  })

  test('flips to true and updates atom when value differs from the initial guess', () => {
    const ctx = createCtx()

    setTabBarHeight(ctx, 82)

    expect(ctx.get(isTabBarMeasuredAtom)).toBe(true)
    expect(ctx.get(tabBarHeightAtom)).toBe(82)
  })
})
