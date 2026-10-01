import { type ColorValue } from 'react-native'
import { COLORS, type ThemeColors, withAlpha } from 'shared/ui/theme'

// RNW derives the ON-track/thumb from `activeTrackColor`/`activeThumbColor`; the
// iOS family mirrors them as `onTintColor`/`thumbTintColor`. The thumb carries the
// full-strength primary; the track behind it is the same hue at reduced opacity so
// the two do not blend into one solid pill. Turning caching ON is the "active"
// state, so ON == active.
export const ON_TRACK_OPACITY = 0.35

export interface ToggleColors {
  activeThumbColor: ColorValue
  activeTrackColor: ColorValue
  onTintColor: ColorValue
  thumbColor: ColorValue
  thumbTintColor: ColorValue
  tintColor: ColorValue
  trackColor: { false: ColorValue; true: ColorValue }
}

// A switch's colors have to ride on three prop families at once: the iOS family
// (`thumbTintColor`/`onTintColor`/`tintColor`), the Android family
// (`thumbColor`/`trackColor`) and the web family that react-native-web actually
// reads (`thumbColor`/`trackColor`/`activeThumbColor`/`activeTrackColor`). RN
// drops the foreign props on each platform, so setting them all is safe.
//
// With Material You (PlatformColor) primary, `withAlpha` passes the value through
// unchanged (it cannot parse a native color), so the ON track renders full-strength
// instead of dimmed — an accepted fallback documented in withAlpha.
export const buildToggleColors = (theme: ThemeColors): ToggleColors => {
  const themedPrimary = theme.primary
  const dimmedTrack = withAlpha(themedPrimary, ON_TRACK_OPACITY)

  return {
    activeThumbColor: themedPrimary,
    activeTrackColor: dimmedTrack,
    onTintColor: dimmedTrack,
    thumbColor: themedPrimary,
    thumbTintColor: themedPrimary,
    tintColor: COLORS.disabled,
    trackColor: { false: COLORS.disabled, true: dimmedTrack },
  }
}
