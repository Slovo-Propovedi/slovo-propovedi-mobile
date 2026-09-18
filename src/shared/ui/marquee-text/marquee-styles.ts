import type { TextStyle } from 'react-native'

type WebTextStyle = {
  whiteSpace?: 'normal' | 'nowrap' | 'pre-line' | 'pre-wrap' | 'pre'
  width?: 'max-content'
} & Omit<TextStyle, 'width'>

export const WEB_MEASURER_STYLE: WebTextStyle = {
  left: 0,
  opacity: 0,
  position: 'absolute',
  top: 0,
  whiteSpace: 'nowrap',
  width: 'max-content',
}

export const NATIVE_MEASURER_STYLE: TextStyle = {
  left: 0,
  opacity: 0,
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
