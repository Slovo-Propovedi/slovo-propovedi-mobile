import {
  getIslandContentPadding,
  getTabItemHeight,
  getTabItemHorizontalMargin,
  getTabItemVerticalMargin,
} from './getIslandStyle'

// Style payloads for the animated morph (0 = expanded bar, 1 = collapsed circle).
//
// Longhand properties are mandatory here. Reanimated updates web styles through
// react-native-web's createReactDOMStyle, which does not expand React Native
// shortforms — that expansion lives in the preprocess step this update path
// skips. A shortform in an animated style therefore freezes at its mount-time
// value while the rest of the morph keeps moving, which left the expanded 12dp
// inset and 5dp item gap on the collapsed 64dp circle and pushed the active
// icon against its right edge.
export const getIslandContentStyle = (progress: number) => {
  const padding = getIslandContentPadding(progress)

  return { paddingLeft: padding, paddingRight: padding }
}

export const getTabItemStyle = (progress: number) => {
  const horizontal = getTabItemHorizontalMargin(progress)
  const vertical = getTabItemVerticalMargin(progress)

  return {
    height: getTabItemHeight(progress),
    marginBottom: vertical,
    marginLeft: horizontal,
    marginRight: horizontal,
    marginTop: vertical,
  }
}
