import { StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

const RESET_TEXT = 'Сбросить'
const RESET_LABEL_PREFIX = 'Сбросить'

interface SectionHeaderProps {
  onReset?: () => void
  title: string
  value?: string
}

export const SectionHeader = ({ onReset, title, value }: SectionHeaderProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
      {value !== undefined && (
        <Text style={[styles.value, { color: currentTheme.textMuted }]}>{value}</Text>
      )}
      {onReset && (
        <PressableButton
          onPress={onReset}
          style={styles.reset}
          accessibilityLabel={`${RESET_LABEL_PREFIX}: ${title}`}
        >
          <Text style={[styles.resetText, { color: currentTheme.primary }]}>{RESET_TEXT}</Text>
        </PressableButton>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.low,
  },
  reset: {
    marginLeft: INDENTS.low,
    paddingHorizontal: INDENTS.low,
    paddingVertical: INDENTS.lowest,
  },
  resetText: { fontSize: FONT_SIZES.base },
  title: { flexShrink: 1, fontSize: FONT_SIZES.base },
  value: { fontSize: FONT_SIZES.base, marginLeft: 'auto' },
})
