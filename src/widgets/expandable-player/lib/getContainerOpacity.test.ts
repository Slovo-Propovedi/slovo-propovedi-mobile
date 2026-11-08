import { getContainerOpacity } from './getContainerOpacity'

describe('getContainerOpacity', () => {
  test('hides the solid container while the player rests collapsed', () => {
    // Regression: a solid `surface` rectangle under the glass pill made the
    // frosted mini player look opaque (its BlurView saw only the solid sheet).
    expect(getContainerOpacity(0)).toBe(0)
  })

  test('shows the container for every non-resting expand/collapse frame', () => {
    expect(getContainerOpacity(0.001)).toBe(1)
    expect(getContainerOpacity(0.5)).toBe(1)
    expect(getContainerOpacity(1)).toBe(1)
  })
})
