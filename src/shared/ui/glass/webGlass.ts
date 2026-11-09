import { type ViewStyle } from 'react-native'
import { getWebGlassBorder, getWebGlassFill, GLASS } from './glass'

/**
 * Web-only glass style. `backdropFilter` is valid in react-native-web's style
 * compiler (it emits the vendor-prefixed CSS) but missing from RN's `ViewStyle`,
 * hence the typed extension instead of a cast. `WebkitBackdropFilter` is the
 * Safari twin: WebKit still honours only the prefixed property.
 */
export interface WebGlassStyle extends ViewStyle {
  backdropFilter: string
  WebkitBackdropFilter: string
}

/**
 * Classic glassmorphism for the web islands: one translucent sheet that blurs
 * and saturates the backdrop, framed by a 1px translucent rim and clipped to
 * the host radius. The filter is emitted twice (standard plus `-webkit-`) so
 * Safari renders the same blur as Chromium. No shadow: the shared
 * `BarBackdropShade` gradient already carries depth.
 * @param isLight - Active theme; selects the tint and rim alpha.
 * @param radius - Corner radius of this surface.
 */
export const getWebGlassStyle = (isLight: boolean, radius: number): WebGlassStyle => ({
  backdropFilter: GLASS.web.backdropFilter,
  backgroundColor: getWebGlassFill(isLight),
  borderColor: getWebGlassBorder(isLight),
  borderRadius: radius,
  borderWidth: 1,
  WebkitBackdropFilter: GLASS.web.backdropFilter,
})
