import { Text } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'

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
  const { currentTheme } = useTheme()

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
          backgroundColor: isResults ? currentTheme.primary : withAlpha(currentTheme.text, 0.1),
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
