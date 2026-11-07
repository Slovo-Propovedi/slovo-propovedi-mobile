import { type BlurMethod, type BlurTint } from 'expo-blur'
import { type ViewStyle } from 'react-native'

/**
 * Single source of truth for the frosted-glass look shared by every floating
 * bottom island (tab island, search circle, mini-player pill, search pill and
 * its close circle). Changing a value here changes all four surfaces at once;
 * only the corner radius stays per-surface and is passed to
 * {@link createGlassStyles}.
 */
export const GLASS = {
  blur: {
    // Android 12+ backdrop blur needs a BlurTargetView wrapping the content
    // behind the surface. The bottom chrome renders inside the tab navigator
    // (inside any candidate target), so the method is recorded here for the
    // shared recipe but only passed once the chrome moves outside the target.
    androidMethod: 'dimezisBlurViewSdk31Plus' satisfies BlurMethod,
    intensity: 60,
  },
  border: { alpha: { dark: 0.12, light: 0.25 }, color: '255, 255, 255' },
  fillAlpha: { dark: 0.35, light: 0.45 },
  shadow: {
    boxShadow: '0px 5px 14px rgba(0, 0, 0, 0.25)',
    color: 'rgba(0, 0, 0, 0.25)',
    offsetY: 5,
    radius: 14,
  },
} as const

const rgba = (channels: string, alpha: number) => `rgba(${channels}, ${alpha})`

export const getGlassFill = (isLight: boolean) =>
  isLight ? rgba('255, 255, 255', GLASS.fillAlpha.light) : rgba('0, 0, 0', GLASS.fillAlpha.dark)

export const getGlassBorder = (isLight: boolean) =>
  rgba(GLASS.border.color, isLight ? GLASS.border.alpha.light : GLASS.border.alpha.dark)

export const getGlassTint = (isLight: boolean): BlurTint => (isLight ? 'light' : 'dark')

/**
 * Builds the per-render glass layers for one island. A factory (not a
 * module-level `StyleSheet.create`) keeps the mutable theme slots following
 * light/dark and Material You switches.
 * @param isLight - Active theme, from `useTheme()`.
 * @param radius - Corner radius of this surface's hairline rim.
 */
export const createGlassStyles = (isLight: boolean, radius: number) => ({
  blur: { intensity: GLASS.blur.intensity, tint: getGlassTint(isLight) },
  container: { boxShadow: GLASS.shadow.boxShadow } satisfies ViewStyle,
  fill: { backgroundColor: getGlassFill(isLight) },
  rim: {
    borderColor: getGlassBorder(isLight),
    borderRadius: radius,
    borderWidth: 1,
  } satisfies ViewStyle,
})
