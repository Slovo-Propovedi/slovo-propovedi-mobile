import { type ColorValue, Text } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'

// Gray selection overlay on the scope track: subtle on the white track, clearly
// lighter on the pure-black one where a 10% black overlay disappears.
const SCOPE_SELECTED_ALPHA = { dark: 0.18, light: 0.1 } as const

const getScopeSelectedFill = (isLight: boolean, text: ColorValue) =>
  withAlpha(text, isLight ? SCOPE_SELECTED_ALPHA.light : SCOPE_SELECTED_ALPHA.dark)

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

  return (
    <PressableButton
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      style={[
        isResults ? styles.resultsItem : styles.segment,
        !isResults && stretch && styles.segmentStretch,
        isResults && selected && styles.resultsItemSelected,
        selected && {
          backgroundColor: isResults
            ? currentTheme.primary
            : getScopeSelectedFill(isLight, currentTheme.text),
        },
      ]}
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
