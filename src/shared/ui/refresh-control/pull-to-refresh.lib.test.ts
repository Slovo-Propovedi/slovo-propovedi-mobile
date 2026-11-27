import {
  computeDisplayedPull,
  computeSpinnerTranslate,
  findVerticalScrollableAncestor,
  REFRESH_MIN_INTERVAL_MS,
  shouldTriggerRefresh,
  SPINNER_SLOT_HEIGHT,
  TRIGGER_DISTANCE,
} from './pull-to-refresh.lib'

interface FakeNode {
  clientHeight: number
  parentElement: FakeNode | null
  scrollHeight: number
  scrollTop: number
}

const makeNode = (overrides: Partial<FakeNode>): HTMLElement =>
  ({
    clientHeight: 0,
    parentElement: null,
    scrollHeight: 0,
    scrollTop: 0,
    ...overrides,
  }) as unknown as HTMLElement

const auto = () => 'auto'

describe('computeDisplayedPull', () => {
  test('applies the resistance factor', () => {
    expect(computeDisplayedPull(100)).toBe(40)
  })

  test('clamps upward movement to zero', () => {
    expect(computeDisplayedPull(-50)).toBe(0)
  })

  test('clamps the displayed pull to the trigger distance', () => {
    expect(computeDisplayedPull(1000)).toBe(TRIGGER_DISTANCE)
  })
})

describe('computeSpinnerTranslate', () => {
  test('centers the spinner in the freed gap', () => {
    expect(computeSpinnerTranslate(TRIGGER_DISTANCE)).toBe(
      (TRIGGER_DISTANCE - SPINNER_SLOT_HEIGHT) / 2,
    )
  })

  test('keeps the spinner at the top when the gap is shorter than the slot', () => {
    expect(computeSpinnerTranslate(SPINNER_SLOT_HEIGHT - 1)).toBe(0)
  })

  test('never returns a negative offset', () => {
    expect(computeSpinnerTranslate(0)).toBe(0)
  })
})

describe('shouldTriggerRefresh', () => {
  test('requires both the threshold and the debounce window', () => {
    expect(shouldTriggerRefresh(TRIGGER_DISTANCE, REFRESH_MIN_INTERVAL_MS)).toBe(true)
    expect(shouldTriggerRefresh(TRIGGER_DISTANCE - 1, REFRESH_MIN_INTERVAL_MS)).toBe(false)
    expect(shouldTriggerRefresh(TRIGGER_DISTANCE, REFRESH_MIN_INTERVAL_MS - 1)).toBe(false)
  })
})

describe('findVerticalScrollableAncestor', () => {
  test('returns the nearest overflowing auto-overflow ancestor', () => {
    const scroller = makeNode({ clientHeight: 100, scrollHeight: 300 })
    const child = makeNode({ parentElement: scroller })

    expect(findVerticalScrollableAncestor(child, auto)).toBe(scroller)
  })

  test('skips a non-overflowing ancestor', () => {
    const scroller = makeNode({ clientHeight: 100, scrollHeight: 300 })
    const wrapper = makeNode({ clientHeight: 100, parentElement: scroller, scrollHeight: 100 })
    const child = makeNode({ parentElement: wrapper })

    expect(findVerticalScrollableAncestor(child, auto)).toBe(scroller)
  })

  test('skips an overflowing ancestor whose overflow-y is hidden', () => {
    const scroller = makeNode({ clientHeight: 100, scrollHeight: 300 })
    const hidden = makeNode({ clientHeight: 100, parentElement: scroller, scrollHeight: 300 })
    const child = makeNode({ parentElement: hidden })

    expect(
      findVerticalScrollableAncestor(child, node => (node === hidden ? 'hidden' : 'auto')),
    ).toBe(scroller)
  })

  test('returns null when no ancestor scrolls vertically', () => {
    const child = makeNode({ parentElement: makeNode({}) })

    expect(findVerticalScrollableAncestor(child, auto)).toBeNull()
  })

  test('returns null for a missing node', () => {
    expect(findVerticalScrollableAncestor(null, auto)).toBeNull()
  })
})
