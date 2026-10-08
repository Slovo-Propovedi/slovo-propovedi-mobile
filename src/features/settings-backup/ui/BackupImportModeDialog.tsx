import { StyleSheet, Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'

const CHOICE_TITLE = 'Применить резервную копию'
const CHOICE_MESSAGE = 'Объединить с текущими данными или заменить их?'

export const BackupImportModeDialog = ({
  onDismiss,
  onMerge,
  onReplace,
  visible,
}: {
  onDismiss: () => void
  onMerge: () => void
  onReplace: () => void
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onDismiss}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{CHOICE_TITLE}</Text>
        <Text style={[styles.message, { color: currentTheme.textMuted }]}>{CHOICE_MESSAGE}</Text>
        <TouchableItem
          onPress={onMerge}
          style={[styles.choice, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={styles.primaryText}>Объединить</Text>
        </TouchableItem>
        <TouchableItem onPress={onReplace} style={styles.choice}>
          <Text style={[styles.choiceText, { color: currentTheme.text }]}>Заменить</Text>
        </TouchableItem>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  choiceText: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  container: {
    padding: INDENTS.high,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  primaryText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
})
