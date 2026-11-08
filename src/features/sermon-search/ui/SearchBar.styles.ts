import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    // Compact like the mic: the pill must fit its whole content on narrow
    // phones, so the button's width comes from icon + padding, not a 48dp
    // minWidth. The touch target is restored by padding + hitSlop.
    minWidth: 0,
    paddingHorizontal: INDENTS.low,
  },
  // Fills the bottom-bar pill; the widget owns background, height and radius.
  // Worst case is a 280dp viewport with the bar collapsed and the external ✕
  // shown: the pill keeps ~104dp between the tab circle and the ✕ slot. Fixed
  // content (padding 16 + magnifier 24 + gaps 8 + borders 2 + input padding 8
  // + compact mic 38 = 96) stays under that, and the flex input absorbs the
  // rest instead of forcing an intrinsic width.
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    // The morph frame owns the left icon and its inset; the input follows it.
    paddingRight: INDENTS.low,
  },
  input: {
    borderRadius: RADIUSES.middle,
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md + INDENTS.lowest,
    marginLeft: INDENTS.lowest,
    // react-native-web gives flex items `min-width: auto`, so the field keeps
    // its intrinsic DOM width and pushes the trailing button past the pill.
    // `minWidth: 0` is what allows the row to actually shrink the input.
    minWidth: 0,
    paddingHorizontal: INDENTS.lowest,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  micButton: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    // Same reason as `clearButton`: icon + horizontal padding stays compact
    // (22 + 2×8 = 38dp), while the 48dp/44dp touch target is provided by the
    // IconButton's minHeight and the hitSlop passed by the caller.
    minWidth: 0,
    paddingHorizontal: INDENTS.low,
  },
  // Web only: react-native-web renders the input as a DOM field, whose default
  // focus ring the design does not use (focus is shown by the caret alone).
  // StyleSheet has no platform branch, so `SearchBar` applies this only when
  // `Platform.OS` is web.
  webInputOutline: {
    outlineColor: 'transparent',
    outlineWidth: 0,
  },
})
