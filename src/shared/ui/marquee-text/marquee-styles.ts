import { type TextStyle, type ViewStyle } from 'react-native'

// Width of the alpha ramp at the trailing clip edge of a fading row.
export const EDGE_FADE_WIDTH = 28

// Test hook: rendered only while the trailing edge actually fades.
export const EDGE_FADE_GRADIENT_TEST_ID = 'marquee-edge-fade-gradient'

// Test hook: the plain-View container probe (see text-edge-fade/index.native).
export const CONTAINER_FALLBACK_TEST_ID = 'marquee-container-fallback'

// Web mask: the text is a child of the masked container, so the fade stays
// pinned to the clip edge while the row scrolls underneath. RNW prefixes
// `maskImage` for WebKit automatically.
export const WEB_EDGE_FADE_STYLE: { maskImage: string } & ViewStyle = {
  maskImage: `linear-gradient(to right, #000 0, #000 calc(100% - ${EDGE_FADE_WIDTH}px), transparent 100%)`,
}

type WebTextStyle = {
  whiteSpace?: 'normal' | 'nowrap' | 'pre-line' | 'pre-wrap' | 'pre'
  width?: 'max-content'
} & Omit<TextStyle, 'width'>

export const WEB_MEASURER_STYLE: WebTextStyle = {
  left: 0,
  opacity: 0,
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  whiteSpace: 'nowrap',
  width: 'max-content',
}

export const NATIVE_MEASURER_STYLE: TextStyle = {
  left: 0,
  opacity: 0,
  // Never claim touches: once de-hidden to the 0.02 ghost on retries it sits
  // topmost over the gesture row, and UIKit hit-tests alpha > 0.01. Web sets
  // the same via WEB_MEASURER_STYLE.
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  // Generous cap: the measurer must never clip the text it measures. 2000 was
  // too small for very long sermon titles; 10000 covers any realistic title.
  width: 10000,
}

// The visible copies must never ellipsize: RNW maps numberOfLines={1} to
// textOverflow: 'ellipsis' (styles.textOneLine), so a scrolling copy whose
// allocated width is a hair smaller than the rendered text (measurement vs
// render font rounding) shows "…". whiteSpace: 'nowrap' forces the single
// line; the container's overflow: 'hidden' does the clipping.
export const WEB_TEXT_STYLE: WebTextStyle = {
  whiteSpace: 'nowrap',
}
