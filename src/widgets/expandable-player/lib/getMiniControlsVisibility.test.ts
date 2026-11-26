import { getWideChromeWidth } from 'shared/ui/layout'
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

const FULL_TOOLBAR = {
  clusterSide: 'left',
  favorite: true,
  menu: true,
  next: true,
  previous: true,
  queue: true,
  repeat: true,
  text: true,
} as const

// Every window at or above the content column yields the same wide chrome, so
// the toolbar must stay whole across the entire wide range.
const WIDE_WINDOWS = [768, 900, 1124, 1440]

describe('getMiniControlsVisibility', () => {
  test.each(BOUNDARIES)(
    '%s renders at its chrome threshold and hides one point below',
    (control, threshold) => {
      expect(getMiniControlsVisibility(threshold)[control]).toBe(true)
      expect(getMiniControlsVisibility(threshold - 1)[control]).toBe(false)
    },
  )

  test.each(WIDE_WINDOWS)(
    '%ipt window maps to the 550pt chrome and shows every control',
    windowWidth => {
      const chromeWidth = getWideChromeWidth(windowWidth)

      expect(chromeWidth).toBe(550)
      expect(getMiniControlsVisibility(chromeWidth)).toEqual(FULL_TOOLBAR)
    },
  )

  test('a control never comes back once it has hidden', () => {
    const chromeWidths = [600, 550, 540, 524, 508, 492, 476, 460, 444, 420]
    const snapshots = chromeWidths.map(width => getMiniControlsVisibility(width))

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

  test('hides only play, right-aligned, once the chrome falls below every threshold', () => {
    expect(getMiniControlsVisibility(HIDE_WIDTHS.next - 1)).toEqual({
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
