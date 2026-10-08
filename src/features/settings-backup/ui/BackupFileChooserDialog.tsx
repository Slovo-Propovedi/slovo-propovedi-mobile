import { Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { type BackupFileOption } from '../lib/backupFiles'
import { choiceDialogStyles as styles } from './choiceDialog.styles'

const TITLE = 'Выберите резервную копию'
const CANCEL_LABEL = 'Отмена'

export const BackupFileChooserDialog = ({
  onDismiss,
  onSelect,
  options,
  visible,
}: {
  onDismiss: () => void
  onSelect: (fileName: string) => void
  options: BackupFileOption[]
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onDismiss}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        {options.map(option => (
          <TouchableItem
            key={option.fileName}
            style={styles.choice}
            onPress={() => onSelect(option.fileName)}
          >
            <Text style={[styles.choiceText, { color: currentTheme.text }]}>{option.label}</Text>
          </TouchableItem>
        ))}
        <TouchableItem onPress={onDismiss} style={styles.choice}>
          <Text style={[styles.choiceText, { color: currentTheme.text }]}>{CANCEL_LABEL}</Text>
        </TouchableItem>
      </View>
    </Modal>
  )
}
