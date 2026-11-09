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
  shadow: {
    boxShadow: '0px 5px 14px rgba(0, 0, 0, 0.25)',
    color: 'rgba(0, 0, 0, 0.25)',
    // Dropped from the wrapper while a morph resizes the surface.
    degraded: 'none',
    offsetY: 5,
    radius: 14,
  },
  web: {
    // expo-blur web cannot express brightness and caps the blur low, so
    // GlassSurface bypasses BlurView with this explicit filter. A shallow 4px
    // blur keeps the background readable (Apple Music reference); the edge ring
    // carries the refraction so the center does not melt into mush.
    backdropFilter: 'blur(4px) saturate(180%) brightness(1.1)',
    // Outer ring (px) that carries the strong displacement. It is deliberately
    // narrow: thick glass bends the backdrop at its rim, not across its face.
    edgeRingWidth: 10,
    // Progressive-enhancement refraction: the SVG filter is declared once in
    // public/index.html. It curves the backdrop at the rim only (edge-ring mask),
    // and an engine without `url()` support keeps the base blur.
    refractionFilter: 'url(#sp-glass-refraction)',
  },
} as const

const rgba = (channels: string, alpha: number) => `rgba(${channels}, ${alpha})`

/** Four additive edge ramps: alpha 1 at every border, 0 at `edgeRingWidth` inside. */
const getWebEdgeRingMask = () =>
  [
    `linear-gradient(to right, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to left, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to bottom, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to top, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
  ].join(', ')

export const getGlassFill = (isLight: boolean, alphaBoost = 0) =>
  isLight
    ? rgba('255, 255, 255', GLASS.fillAlpha.light + alphaBoost)
    : rgba('0, 0, 0', GLASS.fillAlpha.dark + alphaBoost)

/**
 * Web-only backdrop style. `backdropFilter` is valid in react-native-web's
 * style compiler (it emits the vendor-prefixed CSS) but missing from RN's own
 * `ViewStyle`, hence the typed extension instead of a cast. The mask fields are
 * web-only CSS too, kept optional so the base layer stays a plain blur.
 */
export interface WebGlassStyle extends ViewStyle {
  backdropFilter: string
  maskComposite?: string
  maskImage?: string
  WebkitMaskComposite?: string
  WebkitMaskImage?: string
}

export const getWebGlassStyle = (): WebGlassStyle => ({
  backdropFilter: GLASS.web.backdropFilter,
})

/**
 * Edge ring that distorts the backdrop like thick glass. The stronger SVG
 * displacement is masked to the outer `edgeRingWidth` so the center stays
 * clean. It renders ABOVE the base blur: the displacement then bends the
 * already-blurred backdrop instead of being smeared away underneath it.
 */
export const getWebRefractionStyle = (): WebGlassStyle => {
  const edgeRingMask = getWebEdgeRingMask()

  return {
    backdropFilter: GLASS.web.refractionFilter,
    maskComposite: 'add',
    maskImage: edgeRingMask,
    WebkitMaskComposite: 'source-over',
    WebkitMaskImage: edgeRingMask,
  }
}

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
  containerDegraded: { boxShadow: GLASS.shadow.degraded } satisfies ViewStyle,
  fill: { backgroundColor: getGlassFill(isLight) },
  rim: {
    borderColor: getGlassBorder(isLight),
    borderRadius: radius,
    borderWidth: 1,
  } satisfies ViewStyle,
})
