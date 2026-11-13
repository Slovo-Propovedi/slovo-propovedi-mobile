import { type ColorValue, type StyleProp, Text, type ViewStyle } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'

// Gray selection overlay on the scope track: subtle on the white track, clearly
// lighter on the pure-black one where a 10% black overlay disappears.
const SCOPE_SELECTED_ALPHA = { dark: 0.18, light: 0.1 } as const
// Android only routes touches across a view that has a real background drawable;
// a `transparent` background counts as none, so an unselected segment would react
// only over its text. A near-invisible themed fill gives the whole cell a
// drawable without reading as a highlight.
const UNSELECTED_FILL_ALPHA = 0.004

const getScopeSelectedFill = (isLight: boolean, text: ColorValue) =>
  withAlpha(text, isLight ? SCOPE_SELECTED_ALPHA.light : SCOPE_SELECTED_ALPHA.dark)

const getUnselectedFill = (text: ColorValue) => withAlpha(text, UNSELECTED_FILL_ALPHA)

// In results the accent fill marks the selection, so the contrast comes from
// boldness of the unselected labels instead of the selected one.
const getFontWeight = (isResults: boolean, selected: boolean) => {
  if (isResults) return selected ? '400' : '700'

  return selected ? '600' : '400'
}

export const PillTabSegment = ({
  disabled = false,
  isResults,
  label,
  onPress,
  selected,
  stretch = false,
}: {
  disabled?: boolean
  isResults: boolean
  label: string
  onPress?: () => void
  selected: boolean
  stretch?: boolean
}) => {
  const { currentTheme, isLight } = useTheme()

  const segmentStyle: StyleProp<ViewStyle> = [
    isResults ? styles.resultsItem : styles.segment,
    !isResults && stretch && styles.segmentStretch,
    isResults && selected && styles.resultsItemSelected,
    // Results unselected items stay background-free (their row has no Android
    // hit-area problem); scope segments always carry a drawable.
    !isResults && !selected && { backgroundColor: getUnselectedFill(currentTheme.text) },
    selected && {
      backgroundColor: isResults
        ? currentTheme.primary
        : getScopeSelectedFill(isLight, currentTheme.text),
    },
  ]

  return (
    <PressableButton
      onPress={onPress}
      // RN Pressable already sets this on its inner View; repeated explicitly so
      // the segment cell is never collapsed away from the native hit test.
      collapsable={false}
      style={segmentStyle}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
    >
      <Text
        style={[
          styles.label,
          isResults && styles.resultsLabel,
          {
            color: disabled
              ? currentTheme.textMuted
              : isResults && selected
                ? currentTheme.onPrimary
                : currentTheme.text,
            fontWeight: getFontWeight(isResults, selected),
          },
        ]}
      >
        {label}
      </Text>
    </PressableButton>
  )
}
