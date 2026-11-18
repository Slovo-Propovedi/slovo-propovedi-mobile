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
      // The top-edge highlight is the light-refraction cue: a bright hairline
      // fade reads as a curved, lit rim on every platform.
      colors: ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0)'],
      heightPercent: '40%',
    },
  },
  blur: {
    // Passed to BlurView whenever the page publishes a target via
    // BlurTargetProvider (Android 12+ only; gated by supportsAndroidBackdropBlur).
    androidMethod: 'dimezisBlurViewSdk31Plus' satisfies BlurMethod,
    // Barely-there blur: the content behind the islands stays crisp and
    // reads through the glass instead of melting into a flat frosted slab.
    intensity: 5,
  },
  border: { alpha: { dark: 0.12, light: 0.25 }, color: '255, 255, 255' },
  // Translucent glass: the fills still carry the island's body now that the
  // blur is nearly gone, but they lean transparent so the page reads through.
  // Mid-gray between the first white/black pass (Issue #153 follow-up) and the
  // old neutral grays: pure channels melted into the white/black page, so the
  // light fill is a hair grayer than white (`#e8e8e8`) and the dark one a hair
  // lighter than black (`#303030`) — the least gray step that still keeps the
  // silhouette on flat backgrounds.
  fillAlpha: { dark: 0.6, light: 0.75 },
  fillColor: { dark: '48, 48, 48', light: '232, 232, 232' },
  web: {
    // Classic glassmorphism, nearly blurless like the native recipe:
    // `backdrop-filter: blur(1px) saturate(140%)`. GlassSurface bypasses
    // BlurView on web and emits both this property and its `-webkit-` twin,
    // because Safari still honours only the prefixed form.
    backdropFilter: 'blur(1px) saturate(140%)',
    // Thin translucent rim: brighter in light theme so the sheet keeps an edge
    // on a bright backdrop, subtler in dark theme where contrast is plentiful.
    borderAlpha: { dark: 0.15, light: 0.45 },
    // Tint on the same gray channels, but slightly DENSER than the native
    // fills: light glass softens the backdrop toward white, dark glass dims it
    // so white text keeps its contrast. Only the alphas differ — the channels
    // are the same; native paints a fill layer above BlurView, web emits a
    // `backdrop-filter` sheet.
    tintAlpha: { dark: 0.65, light: 0.8 },
  },
} as const

const rgba = (channels: string, alpha: number) => `rgba(${channels}, ${alpha})`

export const getGlassFill = (isLight: boolean, alphaBoost = 0) => {
  // 0.6 + 0.06 is 0.6599999999999999 in IEEE 754 — round to the recipe's 2dp.
  const alpha =
    Math.round(((isLight ? GLASS.fillAlpha.light : GLASS.fillAlpha.dark) + alphaBoost) * 100) / 100

  return rgba(isLight ? GLASS.fillColor.light : GLASS.fillColor.dark, alpha)
}

export const getGlassBorder = (isLight: boolean) =>
  rgba(GLASS.border.color, isLight ? GLASS.border.alpha.light : GLASS.border.alpha.dark)

export const getWebGlassFill = (isLight: boolean) =>
  isLight
    ? rgba(GLASS.fillColor.light, GLASS.web.tintAlpha.light)
    : rgba(GLASS.fillColor.dark, GLASS.web.tintAlpha.dark)

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
