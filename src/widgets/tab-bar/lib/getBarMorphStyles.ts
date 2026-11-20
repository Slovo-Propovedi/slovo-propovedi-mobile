import { getIslandContentPadding } from './getIslandStyle'
import {
  getTabItemHeight,
  getTabItemHorizontalMargin,
  getTabItemVerticalMargin,
} from './getTabItemStyle'

// Style payloads for the animated morph (0 = expanded bar, 1 = collapsed circle).
//
// Longhand properties are mandatory here. Reanimated updates web styles through
// react-native-web's createReactDOMStyle, which does not expand React Native
// shortforms — that expansion lives in the preprocess step this update path
// skips. A shortform in an animated style therefore freezes at its mount-time
// value while the rest of the morph keeps moving, which left the expanded 12dp
// inset and 5dp item gap on the collapsed 48dp circle and pushed the active
// icon against its right edge.
export const getIslandContentStyle = (progress: number) => {
  'worklet'
  const padding = getIslandContentPadding(progress)

  return { paddingLeft: padding, paddingRight: padding }
}

// Vertical geometry (item height) follows the one-line (height) axis so the item
// always fills the island: 68 tall beside an open field even when the shape
// collapses to a circle, 48 in the compact one-line row. Horizontal margins keep
// following the shape axis (progress): they fade out so the circle's item fills
// it width-wise. Both axes are required so a caller cannot silently couple the
// height to the shape progress.
export const getTabItemStyle = (progress: number, oneLineProgress: number) => {
  'worklet'
  const horizontal = getTabItemHorizontalMargin(progress)
  const vertical = getTabItemVerticalMargin(progress)

  return {
    height: getTabItemHeight(oneLineProgress),
    marginBottom: vertical,
    marginLeft: horizontal,
    marginRight: horizontal,
    marginTop: vertical,
  }
}
