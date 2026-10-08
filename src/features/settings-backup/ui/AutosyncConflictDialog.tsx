import { Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { choiceDialogStyles as styles } from './choiceDialog.styles'

const TITLE = 'Автосинхронизация'
const IMPORT_MESSAGE = 'В папке уже есть авторезервная копия. Что сделать с ней?'
const UNUSABLE_MESSAGE = 'Файл авторезервной копии повреждён. Перезаписать его текущими данными?'

export const AutosyncConflictDialog = ({
  canImport,
  onDismiss,
  onImportMerge,
  onImportReplace,
  onOverwrite,
  visible,
}: {
  canImport: boolean
  onDismiss: () => void
  onImportMerge: () => void
  onImportReplace: () => void
  onOverwrite: () => void
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onDismiss}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
        <Text style={[styles.message, { color: currentTheme.textMuted }]}>
          {canImport ? IMPORT_MESSAGE : UNUSABLE_MESSAGE}
        </Text>
        {canImport && (
          <TouchableItem
            onPress={onImportMerge}
            style={[styles.choice, { backgroundColor: currentTheme.primary }]}
          >
            <Text style={styles.primaryText}>Импортировать (объединить)</Text>
          </TouchableItem>
        )}
        {canImport && (
          <TouchableItem style={styles.choice} onPress={onImportReplace}>
            <Text style={[styles.choiceText, { color: currentTheme.text }]}>
              Импортировать (заменить)
            </Text>
          </TouchableItem>
        )}
        <TouchableItem
          onPress={onOverwrite}
          style={[styles.choice, canImport ? undefined : { backgroundColor: currentTheme.primary }]}
        >
          <Text
            style={
              canImport ? [styles.choiceText, { color: currentTheme.text }] : styles.primaryText
            }
          >
            Перезаписать бэкап
          </Text>
        </TouchableItem>
        <TouchableItem onPress={onDismiss} style={styles.choice}>
          <Text style={[styles.choiceText, { color: currentTheme.text }]}>Отмена</Text>
        </TouchableItem>
      </View>
    </Modal>
  )
}
