import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'

interface ClearCacheDialogProps {
  onCancel: () => void
  onConfirm: () => void
  visible: boolean
}

export const ClearCacheDialog = ({ onCancel, onConfirm, visible }: ClearCacheDialogProps) => {
  const { currentTheme } = useTheme()

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onCancel}
      testID='clear-cache-dialog'
    >
      <Pressable
        onPress={onCancel}
        style={[styles.backdrop, { backgroundColor: currentTheme.backdrop }]}
      >
        <View style={[styles.dialog, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Очистить кэш?</Text>
          <Text style={[styles.message, { color: currentTheme.text }]}>
            Это удалит все скачанные аудио файлы проповедей из памяти приложения.
          </Text>
          <Text style={[styles.message, { color: currentTheme.text }]}>
            Вам нужно будет скачать их снова для офлайн прослушивания.
          </Text>
          <Text style={[styles.message, { color: currentTheme.text }]}>
            Текущее воспроизведение и настройки плеера НЕ пострадают.
          </Text>
          <View style={styles.buttons}>
            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <View style={styles.buttonContent}>
                <Ionicons size={20} name='close' color={COLORS.black} />
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButton, { backgroundColor: currentTheme.primary }]}
            >
              <View style={styles.buttonContent}>
                <Ionicons size={20} name='trash' color={COLORS.onPrimary} />
                <Text style={styles.confirmButtonText}>Очистить</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  cancelButton: {
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    flex: 1,
    paddingVertical: INDENTS.middle,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  confirmButton: {
    borderRadius: RADIUSES.low,
    flex: 1,
    paddingVertical: INDENTS.middle,
  },
  confirmButtonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialog: {
    borderRadius: RADIUSES.middle,
    padding: INDENTS.high,
  },
  message: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
