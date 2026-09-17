import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { activeCacheUrlAtom, cacheQueueAtom, clearAudioCacheAction } from 'shared/lib/audio-cache'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { ErrorDialog, useErrorDialog } from 'shared/ui/error-dialog'
import { IconButton } from 'shared/ui/icon-button'
import { type AnchorRect, MenuDropdown } from 'shared/ui/menu'
import { useTheme } from 'shared/ui/theme'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

const CLEAR_TITLE = 'Очистить офлайн?'
const CLEAR_MESSAGE =
  'Все офлайн-проповеди будут удалены. Для офлайн-прослушивания их нужно добавить заново.'
const CLEAR_CONFIRM_TEXT = 'Очистить'
const CLEAR_FAILED_MESSAGE = 'Не удалось очистить офлайн. Попробуйте снова.'
const CLEAR_ERROR_MESSAGE = 'Ошибка при очистке офлайна'

export const OfflineHeaderMenu = () => {
  const { currentTheme } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const buttonRef = useRef<View>(null)
  const clearCache = useAction(clearAudioCacheAction)
  const [queue] = useAtom(cacheQueueAtom)
  const [activeUrl] = useAtom(activeCacheUrlAtom)
  const { dismissError, errorDetail, errorMessage, showError } = useErrorDialog()

  // Reactive parity with the playlist menu: clearing the cache directory
  // mid-download could delete the .part file the queue runner is writing.
  const isClearCacheBusy = Object.keys(queue).length > 0 || activeUrl !== null

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  const handleClearOption = () => {
    setMenuVisible(false)
    setDialogVisible(true)
  }

  const handleClearConfirm = () => {
    setDialogVisible(false)

    void clearCache()
      .then(result => {
        if (!result?.success && result?.error) showError(result.error, CLEAR_FAILED_MESSAGE)
      })
      .catch(error => {
        showError(error, CLEAR_ERROR_MESSAGE)
      })
  }

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <IconButton
          style={styles.button}
          onPress={handleOpenMenu}
          accessibilityLabel='Меню офлайн-библиотеки'
          Icon={
            <MaterialCommunityIcons
              size={ICON_SIZE}
              name='dots-vertical'
              color={currentTheme.text}
            />
          }
        />
      </View>

      <MenuDropdown
        anchor={menuAnchor}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={[
          {
            disabled: isClearCacheBusy,
            icon: 'trash-outline',
            onPress: handleClearOption,
            text: 'Очистить офлайн',
          },
        ]}
      />

      <ConfirmDialog
        title={CLEAR_TITLE}
        message={CLEAR_MESSAGE}
        visible={dialogVisible}
        onConfirm={handleClearConfirm}
        confirmText={CLEAR_CONFIRM_TEXT}
        onCancel={() => setDialogVisible(false)}
      />

      <ErrorDialog
        detail={errorDetail}
        onDismiss={dismissError}
        message={errorMessage || ''}
        visible={errorMessage !== null}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
})
