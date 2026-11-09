import { type ViewStyle } from 'react-native'
import { GLASS } from './glass'

/** Four additive edge ramps: alpha 1 at every border, 0 at `edgeRingWidth` inside. */
const getWebEdgeRingMask = () =>
  [
    `linear-gradient(to right, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to left, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to bottom, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
    `linear-gradient(to top, #000 0, transparent ${GLASS.web.edgeRingWidth}px)`,
  ].join(', ')

/**
 * Web-only backdrop style. `backdropFilter` is valid in react-native-web's
 * style compiler (it emits the vendor-prefixed CSS) but missing from RN's
 * `ViewStyle`, hence the typed extension instead of a cast. Mask fields are
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
 * clean; it renders ABOVE the base blur, bending the already-blurred backdrop
 * instead of being smeared away underneath it.
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
