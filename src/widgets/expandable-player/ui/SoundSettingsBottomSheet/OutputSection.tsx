import { openAudioOutputSwitcher } from 'audio-effects'
import { StyleSheet, Text } from 'react-native'
import { reportError } from 'shared/model/error-dialog'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

const OUTPUT_TITLE = 'Источник звука'
const OUTPUT_ACTION_LABEL = 'Выбрать устройство вывода'
const REPORT_MESSAGE = 'Не удалось открыть выбор устройства вывода'

export const OutputSection = () => {
  const { currentTheme } = useTheme()

  // The native module no-ops off-Android; a throw here must never crash the
  // app — the output switcher is cosmetic.
  const handlePress = () => {
    try {
      openAudioOutputSwitcher()
    } catch (error) {
      reportError(error, REPORT_MESSAGE)
    }
  }

  return (
    <PressableButton
      style={styles.row}
      onPress={handlePress}
      accessibilityLabel={OUTPUT_ACTION_LABEL}
    >
      <Text style={[styles.title, { color: currentTheme.text }]}>{OUTPUT_TITLE}</Text>
      <Text style={[styles.action, { color: currentTheme.textMuted }]}>{OUTPUT_ACTION_LABEL}</Text>
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  action: {
    flexShrink: 0,
    fontSize: FONT_SIZES.base,
    marginLeft: INDENTS.low,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: INDENTS.low,
  },
  title: {
    flexShrink: 1,
    fontSize: FONT_SIZES.base,
  },
})
