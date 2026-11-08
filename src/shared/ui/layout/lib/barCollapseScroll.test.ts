import { COLLAPSE_SCROLL_THRESHOLD, EXPAND_TOP_THRESHOLD } from '../bottomBarLayout'
import { nextBarCollapsedState } from './barCollapseScroll'

describe('nextBarCollapsedState', () => {
  test('collapses past the collapse threshold', () => {
    expect(nextBarCollapsedState(COLLAPSE_SCROLL_THRESHOLD + 1, false)).toBe(true)
  })

  test('does not collapse exactly at the collapse threshold', () => {
    expect(nextBarCollapsedState(COLLAPSE_SCROLL_THRESHOLD, false)).toBeNull()
  })

  test('expands at or above the top threshold', () => {
    expect(nextBarCollapsedState(EXPAND_TOP_THRESHOLD, true)).toBe(false)
    expect(nextBarCollapsedState(EXPAND_TOP_THRESHOLD - 1, true)).toBe(false)
  })

  test('keeps the current state inside the hysteresis band', () => {
    const bandOffset = EXPAND_TOP_THRESHOLD + 1

    expect(nextBarCollapsedState(bandOffset, false)).toBeNull()
    expect(nextBarCollapsedState(bandOffset, true)).toBeNull()
  })

  test('reports a crossing only when the state actually changes', () => {
    expect(nextBarCollapsedState(COLLAPSE_SCROLL_THRESHOLD + 100, true)).toBeNull()
    expect(nextBarCollapsedState(0, false)).toBeNull()
  })
})
