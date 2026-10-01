import { COLORS, LightTheme, withAlpha } from 'shared/ui/theme'
import { buildToggleColors, ON_TRACK_OPACITY } from './buildToggleColors'

const THEMED_PRIMARY = LightTheme.primary
const THEMED_ON_TRACK = withAlpha(THEMED_PRIMARY, ON_TRACK_OPACITY)
const OFF_TRACK = COLORS.disabled

describe('buildToggleColors', () => {
  test('paints the ON state with the theme primary on every prop family', () => {
    const colors = buildToggleColors(LightTheme)

    // iOS family.
    expect(colors.thumbTintColor).toBe(THEMED_PRIMARY)
    expect(colors.onTintColor).toBe(THEMED_ON_TRACK)
    expect(colors.tintColor).toBe(OFF_TRACK)

    // Android family.
    expect(colors.thumbColor).toBe(THEMED_PRIMARY)
    expect(colors.trackColor).toEqual({ false: OFF_TRACK, true: THEMED_ON_TRACK })

    // react-native-web family.
    expect(colors.activeThumbColor).toBe(THEMED_PRIMARY)
    expect(colors.activeTrackColor).toBe(THEMED_ON_TRACK)
  })

  test('derives every family from the given theme', () => {
    const colors = buildToggleColors({ ...LightTheme, primary: '#123456' })

    expect(colors.thumbTintColor).toBe('#123456')
    expect(colors.thumbColor).toBe('#123456')
    expect(colors.activeThumbColor).toBe('#123456')
  })
})
