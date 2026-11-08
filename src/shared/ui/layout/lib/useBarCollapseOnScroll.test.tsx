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
  const createSharedValue = (init: unknown) => {
    const sharedValue = {
      set(value: unknown) {
        sharedValue.value = value
      },
      value: init,
    }

    return sharedValue
  }

  return {
    __esModule: true,
    createAnimatedComponent,
    default: { createAnimatedComponent, FlatList, View },
    makeMutable: createSharedValue,
    useAnimatedScrollHandler: (handler: unknown) => handler,
    useSharedValue: createSharedValue,
  }
})

const scrollEventAt = (y: number, contentHeight?: number) =>
  ({
    contentOffset: { y },
    ...(contentHeight === undefined ? {} : { contentSize: { height: contentHeight, width: 0 } }),
  }) as unknown as NativeSyntheticEvent<NativeScrollEvent>

const renderDriver = async (isSuspended = false) => {
  const ctx = createCtx()
  const { result } = await renderHookWithProviders(() => useBarCollapseOnScroll({ isSuspended }), {
    ctx,
  })

  return {
    ctx,
    notifyContentSize: (height: number) => result.current.onContentSizeChange(0, height),
    scrollTo: (y: number, contentHeight?: number) =>
      result.current.onScroll(scrollEventAt(y, contentHeight)),
  }
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

  test('does not re-collapse on a layout scroll event at the unchanged offset after an external expand', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    // Tapping the collapsed circle (or the search circle) expands the bar
    // without any scroll gesture. The tap itself can cause a layout/keyboard
    // change that replays onScroll at the SAME offset; that is not a scroll and
    // must not undo the expand before the user sees it.
    setBarCollapsed(ctx, false)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('re-collapses after an external expand once the user scrolls again', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 1)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    setBarCollapsed(ctx, false)

    scrollTo(COLLAPSE_SCROLL_THRESHOLD + 40)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('does not re-collapse when a layout change shifts the offset after an external expand', async () => {
    const { ctx, notifyContentSize, scrollTo } = await renderDriver()

    scrollTo(600)
    notifyContentSize(2649)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    // Tapping the search circle expands the bar. Opening the search unmounts a
    // row above the viewport, so the browser keeps the visible content in place
    // by shifting the scroll offset (600 → 552) and emits a regular onScroll.
    // That shifted offset is not a gesture and must not re-collapse the bar.
    notifyContentSize(2601)
    setBarCollapsed(ctx, false)

    scrollTo(552)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('honours the next real scroll after a layout-induced offset shift', async () => {
    const { ctx, notifyContentSize, scrollTo } = await renderDriver()

    scrollTo(600)
    notifyContentSize(2649)
    notifyContentSize(2601)
    setBarCollapsed(ctx, false)
    scrollTo(552)

    // The user scrolls down again: the bar collapses as usual.
    scrollTo(700)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('ignores the mount measurement so the first scroll gesture still collapses', async () => {
    const { ctx, notifyContentSize, scrollTo } = await renderDriver()

    // The content container reports its height once on mount; that is not a
    // layout change and must not swallow the user's first scroll.
    notifyContentSize(2649)
    scrollTo(600)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)
  })

  test('re-baselines when the anchoring scroll carries the shrunk content before onContentSizeChange', async () => {
    // Browser event order on web: the anchoring scroll is dispatched in the
    // render step, while react-native-web's onContentSizeChange is an onLayout
    // callback that only lands on the next React commit. The driver therefore
    // sees the shifted offset FIRST, already paired with the new contentSize —
    // that changed size is the proof it was layout anchoring, not a gesture.
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(600, 2649)

    expect(ctx.get(isBarCollapsedAtom)).toBe(true)

    // Tapping the search circle opens the field and unmounts the top row above
    // the viewport: content 2649 → 2601, offset 600 → 552.
    setBarCollapsed(ctx, false)

    scrollTo(552, 2601)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('re-baselines on the anchoring scroll when closing search remounts a row', async () => {
    // Same race in the opposite direction: closing the search session remounts
    // the top row, so the content grows and the offset shifts down. The active
    // tab circle must expand the bar on the first tap, not after a re-collapse.
    const { ctx, notifyContentSize, scrollTo } = await renderDriver()

    scrollTo(600, 2649)
    notifyContentSize(2649)
    setBarCollapsed(ctx, false)

    scrollTo(648, 2697)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })

  test('collapses on the next gesture scroll after a layout-induced shift', async () => {
    const { ctx, scrollTo } = await renderDriver()

    scrollTo(600, 2649)
    setBarCollapsed(ctx, false)
    scrollTo(552, 2601)

    // The user scrolls down again with the layout settled: same size, real gesture.
    scrollTo(700, 2601)

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
