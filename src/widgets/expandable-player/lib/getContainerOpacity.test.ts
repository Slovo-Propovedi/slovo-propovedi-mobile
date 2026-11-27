import { getContainerOpacity, getMiniPlayerOpacity } from './getContainerOpacity'

// The collapse is one progress-tied crossfade: the fullscreen sheet keeps the
// content fade-out opaque, then dissolves into the mini pill while the pill is
// already fully opaque underneath. Both layers must never be transparent at the
// same time, or the page flashes through the player.
describe('player collapse crossfade', () => {
  test('hides the solid container while the player rests collapsed', () => {
    // Regression: a solid `surface` rectangle under the glass pill made the
    // frosted mini player look opaque (its BlurView saw only the solid sheet).
    expect(getContainerOpacity(0)).toBe(0)
  })

  test('keeps the sheet fully opaque through the content fade-out', () => {
    expect(getContainerOpacity(0.5)).toBe(1)
    expect(getContainerOpacity(0.8)).toBe(1)
    expect(getContainerOpacity(1)).toBe(1)
  })

  test('dissolves the sheet only in the tail of the collapse', () => {
    expect(getContainerOpacity(0.15)).toBe(0)
    // The ramp runs [0.15, 0.5] -> [0, 1]; its midpoint is half transparent.
    expect(getContainerOpacity(0.325)).toBeCloseTo(0.5, 5)
    expect(getContainerOpacity(0.1)).toBe(0)
  })

  test('fades the pill out only after the sheet already covers it', () => {
    expect(getMiniPlayerOpacity(0)).toBe(1)
    expect(getMiniPlayerOpacity(0.5)).toBe(1)
    expect(getMiniPlayerOpacity(0.75)).toBe(0)
    expect(getMiniPlayerOpacity(1)).toBe(0)
  })

  test('never leaves a frame where sheet and pill are both transparent', () => {
    for (let progress = 0; progress <= 1; progress += 0.05)
      expect(getContainerOpacity(progress) + getMiniPlayerOpacity(progress)).toBeGreaterThanOrEqual(
        1,
      )
  })
})
