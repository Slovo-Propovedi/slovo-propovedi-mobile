/**
 * One gradient stop: opaque tint + the alpha that rides `stopOpacity`.
 * Alpha must never live inside the colour string: react-native-svg masks
 * `stopColor` alpha off on native, so only `stopOpacity` reaches Android.
 */
export interface ShadeStop {
  color: string
  opacity: number
}

// One subtle depth cue behind the bottom-bar complex: edge to edge, anchored to
// the screen bottom (the transparent Android navbar means the inset is ignored).
// Its top tracks the current chrome top with overscan, and one continuous
// gradient leaves no cap/fill junction. The shade is cut out under the glass
// islands, so it only reads around and between them: same alpha in both themes,
// only the tint flips — black over light, white over dark.
const SHADE_OPAQUE_LIGHT = '#000000'
const SHADE_OPAQUE_DARK = '#ffffff'

const SHADE_STOPS_LIGHT: readonly ShadeStop[] = [
  { color: SHADE_OPAQUE_LIGHT, opacity: 0 },
  { color: SHADE_OPAQUE_LIGHT, opacity: 0.12 },
  { color: SHADE_OPAQUE_LIGHT, opacity: 0.12 },
]

const SHADE_STOPS_DARK: readonly ShadeStop[] = [
  { color: SHADE_OPAQUE_DARK, opacity: 0 },
  { color: SHADE_OPAQUE_DARK, opacity: 0.12 },
  { color: SHADE_OPAQUE_DARK, opacity: 0.12 },
]

export const getShadeColors = (isLight: boolean) => (isLight ? SHADE_STOPS_LIGHT : SHADE_STOPS_DARK)
