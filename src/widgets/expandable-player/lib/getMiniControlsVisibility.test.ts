import {
  getMiniControlsVisibility,
  MINI_WIDE_CONTROL_HIDE_WIDTHS,
} from './getMiniControlsVisibility'

const HIDE_WIDTHS = MINI_WIDE_CONTROL_HIDE_WIDTHS

const BOUNDARIES = [
  ['text', HIDE_WIDTHS.text],
  ['menu', HIDE_WIDTHS.menu],
  ['queue', HIDE_WIDTHS.queue],
  ['repeat', HIDE_WIDTHS.repeat],
  ['favorite', HIDE_WIDTHS.favorite],
  ['previous', HIDE_WIDTHS.previous],
  ['next', HIDE_WIDTHS.next],
] as const

describe('getMiniControlsVisibility', () => {
  test.each(BOUNDARIES)(
    '%s renders at its threshold and hides one point below',
    (control, threshold) => {
      expect(getMiniControlsVisibility(threshold)[control]).toBe(true)
      expect(getMiniControlsVisibility(threshold - 1)[control]).toBe(false)
    },
  )

  test('a control never comes back once it has hidden', () => {
    const widths = [1280, 1024, 960, 920, 880, 856, 832, 808, 784, 768]
    const snapshots = widths.map(width => getMiniControlsVisibility(width))

    BOUNDARIES.forEach(([control]) => {
      const flags = snapshots.map(snapshot => snapshot[control])
      const firstHidden = flags.indexOf(false)

      if (firstHidden === -1) return

      expect(flags.slice(firstHidden).every(flag => !flag)).toBe(true)
    })
  })

  test('the cluster stays left until the last right-cluster button hides', () => {
    expect(getMiniControlsVisibility(HIDE_WIDTHS.queue).clusterSide).toBe('left')
    expect(getMiniControlsVisibility(HIDE_WIDTHS.queue - 1).clusterSide).toBe('right')
  })

  test('keeps the full toolbar and the left cluster on wide desktops', () => {
    expect(getMiniControlsVisibility(1024)).toEqual({
      clusterSide: 'left',
      favorite: true,
      menu: true,
      next: true,
      previous: true,
      queue: true,
      repeat: true,
      text: true,
    })
  })

  test('keeps only play, right-aligned, just above the phone breakpoint', () => {
    expect(getMiniControlsVisibility(770)).toEqual({
      clusterSide: 'right',
      favorite: false,
      menu: false,
      next: false,
      previous: false,
      queue: false,
      repeat: false,
      text: false,
    })
  })
})
