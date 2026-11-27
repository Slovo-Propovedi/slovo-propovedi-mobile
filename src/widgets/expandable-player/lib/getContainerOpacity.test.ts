import { getContainerOpacity, getMiniPlayerOpacity } from './getContainerOpacity'

const STEPS = 20

const progressAt = (step: number) => step / STEPS

// The sheet has two contracts, selected by whether the mini layer is mounted:
// - collapse: the pill is mounted underneath and crossfades with the sheet;
// - expand: the pill is unmounted in the same commit, so the sheet is binary.
const sheet = (progress: number, isMiniLayerMounted: boolean) =>
  getContainerOpacity(progress, isMiniLayerMounted)

describe('player sheet opacity while the mini layer is mounted (collapse)', () => {
  test('hides the solid container while the player rests collapsed', () => {
    // Regression: a solid `surface` rectangle under the glass pill made the
    // frosted mini player look opaque (its BlurView saw only the solid sheet).
    expect(getContainerOpacity(0, true)).toBe(0)
  })

  test('keeps the sheet fully opaque through the content fade-out', () => {
    expect(sheet(0.5, true)).toBe(1)
    expect(sheet(0.8, true)).toBe(1)
    expect(sheet(1, true)).toBe(1)
  })

  test('dissolves the sheet only in the tail of the collapse', () => {
    expect(sheet(0.15, true)).toBe(0)
    // The ramp runs [0.15, 0.5] -> [0, 1]; its midpoint is half transparent.
    expect(sheet(0.325, true)).toBeCloseTo(0.5, 5)
    expect(sheet(0.1, true)).toBe(0)
  })

  test('fades the pill in under the still-opaque sheet', () => {
    expect(getMiniPlayerOpacity(0.75)).toBe(0)
    expect(getMiniPlayerOpacity(1)).toBe(0)
    expect(getMiniPlayerOpacity(0.5)).toBe(1)
    expect(getMiniPlayerOpacity(0)).toBe(1)
  })
})

describe('player sheet opacity while the mini layer is unmounted (expand)', () => {
  test('keeps the sheet solid on the tap/flick flip frame', () => {
    // The flip frame still has progress 0 while the pill is already unmounted;
    // a transparent frame there is the hole the user complained about. The
    // collapsed REST is the mounted branch, not this one.
    expect(sheet(0, false)).toBe(1)
  })

  test('keeps the sheet fully solid from the first expand frame', () => {
    // Nothing is painted under the sheet on expand: a tail ramp would leave a
    // transparent hole on the tap/flick until progress reached the ramp start.
    for (let step = 1; step <= STEPS; step++) expect(sheet(progressAt(step), false)).toBe(1)
  })
})

describe('no frame with both player layers transparent', () => {
  test('sheet plus mounted pill always cover the page', () => {
    for (const isMiniLayerMounted of [true, false])
      for (let step = 0; step <= STEPS; step++) {
        const progress = progressAt(step)
        const pill = isMiniLayerMounted ? getMiniPlayerOpacity(progress) : 0

        expect(sheet(progress, isMiniLayerMounted) + pill).toBeGreaterThanOrEqual(1)
      }
  })
})
