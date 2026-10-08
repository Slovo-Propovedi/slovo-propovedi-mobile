import { Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { choiceDialogStyles as styles } from './choiceDialog.styles'

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
