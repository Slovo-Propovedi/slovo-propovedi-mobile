import { type BlurMethod, type BlurTint } from 'expo-blur'
import { type ViewStyle } from 'react-native'

/**
 * Single source of truth for the frosted-glass look shared by every floating
 * bottom island (tab island, search circle, mini-player pill, search pill and
 * its close circle). Changing a value here changes all four surfaces at once;
 * only the corner radius stays per-surface and is passed to
 * {@link createGlassStyles}. Surfaces carry no shadow of their own: depth comes
 * from the shared `BarBackdropShade` gradient.
 */
export const GLASS = {
  android: {
    // Android 11 and below cannot blur (no BlurTarget), so the surface gains
    // depth from a brighter top edge and a slightly denser fill instead.
    fillAlphaBoost: 0.06,
    sheen: {
      colors: ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0)'],
      heightPercent: '40%',
    },
  },
  blur: {
    // Passed to BlurView whenever the page publishes a target via
    // BlurTargetProvider (Android 12+ only; gated by supportsAndroidBackdropBlur).
    androidMethod: 'dimezisBlurViewSdk31Plus' satisfies BlurMethod,
    // Apple Music blurs only moderately: the content behind the islands stays
    // readable instead of melting into a flat frosted slab.
    intensity: 40,
  },
  border: { alpha: { dark: 0.12, light: 0.25 }, color: '255, 255, 255' },
  fillAlpha: { dark: 0.35, light: 0.45 },
  web: {
    // Classic glassmorphism: `backdrop-filter: blur(12px) saturate(140%)`.
    // GlassSurface bypasses BlurView on web and emits both this property and its
    // `-webkit-` twin, because Safari still honours only the prefixed form.
    backdropFilter: 'blur(12px) saturate(140%)',
    // Thin translucent rim: brighter in light theme so the sheet keeps an edge
    // on a bright backdrop, subtler in dark theme where contrast is plentiful.
    borderAlpha: { dark: 0.15, light: 0.45 },
    // Translucent tint: light glass whitens the backdrop slightly, dark glass
    // darkens it so white text keeps its contrast.
    tintAlpha: { dark: 0.3, light: 0.18 },
  },
} as const

const rgba = (channels: string, alpha: number) => `rgba(${channels}, ${alpha})`

export const getGlassFill = (isLight: boolean, alphaBoost = 0) =>
  isLight
    ? rgba('255, 255, 255', GLASS.fillAlpha.light + alphaBoost)
    : rgba('0, 0, 0', GLASS.fillAlpha.dark + alphaBoost)

export const getGlassBorder = (isLight: boolean) =>
  rgba(GLASS.border.color, isLight ? GLASS.border.alpha.light : GLASS.border.alpha.dark)

export const getWebGlassFill = (isLight: boolean) =>
  isLight
    ? rgba(GLASS.border.color, GLASS.web.tintAlpha.light)
    : rgba('0, 0, 0', GLASS.web.tintAlpha.dark)

export const getWebGlassBorder = (isLight: boolean) =>
  rgba(GLASS.border.color, isLight ? GLASS.web.borderAlpha.light : GLASS.web.borderAlpha.dark)

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
  // Shadowless host: the islands rely on the shared `BarBackdropShade` gradient.
  containerPlain: {} satisfies ViewStyle,
  fill: { backgroundColor: getGlassFill(isLight) },
  rim: {
    borderColor: getGlassBorder(isLight),
    borderRadius: radius,
    borderWidth: 1,
  } satisfies ViewStyle,
})
