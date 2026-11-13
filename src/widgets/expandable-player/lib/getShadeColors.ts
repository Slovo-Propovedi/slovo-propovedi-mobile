// One subtle depth cue behind the bottom-bar complex: edge to edge, anchored to
// the screen bottom (the transparent Android navbar means the inset is ignored).
// Its top tracks the current chrome top with overscan, and one continuous
// gradient leaves no cap/fill junction. The shade is cut out under the glass
// islands, so it only reads around and between them: light theme darkens the
// page slightly, dark theme lifts it with a gray that stays visible on black.
const SHADE_OPAQUE_LIGHT = 'rgba(0, 0, 0, 0.12)'
const SHADE_OPAQUE_DARK = 'rgba(144, 144, 144, 0.16)'
const SHADE_COLORS_LIGHT = ['rgba(0, 0, 0, 0)', SHADE_OPAQUE_LIGHT, SHADE_OPAQUE_LIGHT] as const
const SHADE_COLORS_DARK = ['rgba(144, 144, 144, 0)', SHADE_OPAQUE_DARK, SHADE_OPAQUE_DARK] as const

export const getShadeColors = (isLight: boolean) =>
  isLight ? SHADE_COLORS_LIGHT : SHADE_COLORS_DARK
