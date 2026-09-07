import { Modal, Platform, Pressable, Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { useWebUpdateWatcher } from '../lib/useWebUpdateWatcher'
import { webUpdateModalStyles as styles } from './webUpdateModalStyles'

const TITLE = 'Доступна новая версия'
const READY_MESSAGE = 'Новая версия приложения загружена. Обновить сейчас?'
const INSTALLING_MESSAGE =
  'Новая версия приложения обнаружена. Она скачивается в фоне и станет доступна через несколько минут.'
const UPDATE_BUTTON_TEXT = 'Обновить'
const LATER_BUTTON_TEXT = 'Позже'

const preventClose = () => {}

export const WebUpdateModal = () => {
  const { apply, applying, dismiss, status } = useWebUpdateWatcher()
  const { currentTheme } = useTheme()

  if (Platform.OS !== 'web' || status === 'idle') return null

  const isReady = status === 'ready'
  const message = isReady ? READY_MESSAGE : INSTALLING_MESSAGE
  const updateDisabled = !isReady || applying

  return (
    <Modal
      visible
      transparent
      animationType='fade'
      statusBarTranslucent
      onRequestClose={applying ? preventClose : dismiss}
    >
      <View style={[styles.backdrop, { backgroundColor: currentTheme.backdrop }]}>
        <View style={[styles.dialog, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>{TITLE}</Text>
          <Text style={[styles.message, { color: currentTheme.textMuted }]}>{message}</Text>
          <View style={styles.buttons}>
            <Pressable
              onPress={apply}
              disabled={updateDisabled}
              accessibilityRole='button'
              style={[
                styles.primaryButton,
                { backgroundColor: currentTheme.primary },
                updateDisabled && styles.disabledButton,
              ]}
            >
              <Text style={styles.primaryButtonText}>{UPDATE_BUTTON_TEXT}</Text>
            </Pressable>
            <Pressable
              onPress={dismiss}
              disabled={applying}
              accessibilityRole='button'
              style={[styles.secondaryButton, applying && styles.disabledButton]}
            >
              <Text style={styles.secondaryButtonText}>{LATER_BUTTON_TEXT}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
