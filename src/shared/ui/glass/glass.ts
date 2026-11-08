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
  android: {
    // Android cannot blur the content behind the bottom chrome (real backdrop
    // blur needs a BlurTargetView restructure, see docs/debt.md), so the surface
    // gains depth from a brighter top edge and a slightly denser fill.
    fillAlphaBoost: 0.06,
    sheen: {
      colors: ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0)'],
      heightPercent: '40%',
    },
  },
  blur: {
    // Android 12+ backdrop blur needs a BlurTargetView wrapping the content
    // behind the surface. The bottom chrome renders inside the tab navigator
    // (inside any candidate target), so the method is recorded here for the
    // shared recipe but only passed once the chrome moves outside the target.
    androidMethod: 'dimezisBlurViewSdk31Plus' satisfies BlurMethod,
    // Apple Music blurs only moderately: the content behind the islands stays
    // readable instead of melting into a flat frosted slab.
    intensity: 40,
  },
  border: { alpha: { dark: 0.12, light: 0.25 }, color: '255, 255, 255' },
  fillAlpha: { dark: 0.35, light: 0.45 },
  shadow: {
    boxShadow: '0px 5px 14px rgba(0, 0, 0, 0.25)',
    color: 'rgba(0, 0, 0, 0.25)',
    offsetY: 5,
    radius: 14,
  },
  web: {
    // expo-blur web cannot express brightness and caps the blur low, so
    // GlassSurface bypasses BlurView with this explicit filter. A moderate 6px
    // blur keeps the background readable (Apple Music reference) instead of
    // turning it into mush; the brightness lift restores the glass sheen.
    backdropFilter: 'blur(6px) saturate(180%) brightness(1.1)',
    // Progressive-enhancement refraction: the SVG filter is declared once in
    // public/index.html. It lives in its OWN layer under the base blur, so an
    // engine that drops `url()` from `backdrop-filter` still shows the blur.
    refractionFilter: 'url(#sp-glass-refraction)',
  },
} as const

const rgba = (channels: string, alpha: number) => `rgba(${channels}, ${alpha})`

export const getGlassFill = (isLight: boolean, alphaBoost = 0) =>
  isLight
    ? rgba('255, 255, 255', GLASS.fillAlpha.light + alphaBoost)
    : rgba('0, 0, 0', GLASS.fillAlpha.dark + alphaBoost)

/**
 * Web-only backdrop style. `backdropFilter` is valid in react-native-web's
 * style compiler (it emits the vendor-prefixed CSS) but is missing from React
 * Native's own `ViewStyle`, hence the small typed extension instead of a cast.
 */
export interface WebGlassStyle extends ViewStyle {
  backdropFilter: string
}

export const getWebGlassStyle = (): WebGlassStyle => ({
  backdropFilter: GLASS.web.backdropFilter,
})

/**
 * Fill-free layer that distorts the backdrop like real glass. Rendered under
 * {@link getWebGlassStyle} so the base blur survives on engines without SVG
 * filters in `backdrop-filter`.
 */
export const getWebRefractionStyle = (): WebGlassStyle => ({
  backdropFilter: GLASS.web.refractionFilter,
})

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
