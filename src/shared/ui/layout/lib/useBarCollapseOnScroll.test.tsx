import { createCtx } from '@reatom/framework'
import { type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { renderHookWithProviders } from '../../../mocks'
import { COLLAPSE_SCROLL_THRESHOLD, EXPAND_TOP_THRESHOLD } from '../bottomBarLayout'
import { isBarCollapsedAtom, setBarCollapsed } from '../model'
import { useBarCollapseOnScroll } from './useBarCollapseOnScroll'

// Reanimated's setup mock has no useAnimatedScrollHandler; the driver test needs
// the raw handler so it can replay scroll offsets through the worklet body.
jest.mock('react-native-reanimated', () => {
  const { FlatList, View } = jest.requireActual('react-native')
  const createAnimatedComponent = (Component: unknown) => Component

  return {
    __esModule: true,
    createAnimatedComponent,
    default: { createAnimatedComponent, FlatList, View },
    useAnimatedScrollHandler: (handler: unknown) => handler,
    useSharedValue: (init: unknown) => {
      const sharedValue = {
        set(value: unknown) {
          sharedValue.value = value
        },
        value: init,
      }

      return sharedValue
    },
  }
})

const scrollEventAt = (y: number) =>
  ({ contentOffset: { y } }) as unknown as NativeSyntheticEvent<NativeScrollEvent>

const renderDriver = async (isSuspended = false) => {
  const ctx = createCtx()
  const { result } = await renderHookWithProviders(() => useBarCollapseOnScroll({ isSuspended }), {
    ctx,
  })

  return { ctx, scrollTo: (y: number) => result.current.onScroll(scrollEventAt(y)) }
}

describe('useBarCollapseOnScroll', () => {
  test('collapses only after the offset passes the collapse threshold', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('stays collapsed inside the hysteresis band and expands at the top threshold', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)
    scrollTo(EXPAND_TOP_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    scrollTo(EXPAND_TOP_THRESHOLD)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('notifies subscribers once per crossing, not per scroll frame', async () => {
    const { ctx, scrollTo } = await renderDriver()
    let changeCount = 0
    ctx.subscribe(isBarCollapsedAtom, () => {
      changeCount += 1
    })

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)
    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 40)
    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 90)

    // 1 initial subscription call + 1 real crossing
    expect(changeCount).toBe(2)
  })

  test('crosses both ways', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 100)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    scrollTo(0)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 100)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('re-collapses after an external expand (tap) and a new downward crossing', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    // Tapping the collapsed circle expands the bar without any scroll event;
    // the driver's snapshot must follow the atom instead of staying stale.
    setBarCollapsed(ctx, false)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('external expand keeps the driver in sync without duplicate flips', async () => {
    const { ctx, scrollTo } = await renderDriver()
    let changeCount = 0
    ctx.subscribe(isBarCollapsedAtom, () => {
      changeCount += 1
    })

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)
    setBarCollapsed(ctx, false)
    // Already expanded at this offset: neither crossing may flip the atom again.
    scrollTo(EXPAND_TOP_THRESHOLD)
    scrollTo(EXPAND_TOP_THRESHOLD + 1)

    // 1 initial subscription call + collapse + external expand
    expect(changeCount).toBe(3)
  })

  test('ignores scroll while suspended', async () => {
    const { ctx, scrollTo } = await renderDriver(true)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 100)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })
})
