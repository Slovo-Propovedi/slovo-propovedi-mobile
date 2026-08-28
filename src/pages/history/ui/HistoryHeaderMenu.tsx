import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { clearHistoryAction } from 'entities/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AnchorRect } from 'shared/ui/anchored-dropdown'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { HistoryHeaderMenuDropdown } from './HistoryHeaderMenuDropdown'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

const CLEAR_TITLE = 'Очистить историю?'
const CLEAR_MESSAGE =
  'Вся история прослушивания будет удалена. Прогресс прослушивания проповедей сбросится.'
const CLEAR_CONFIRM_TEXT = 'Очистить'

export const HistoryHeaderMenu = () => {
  const { currentTheme } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const buttonRef = useRef<View>(null)

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  const handleClearOption = useCallback(() => {
    setMenuVisible(false)
    setDialogVisible(true)
  }, [])

  const handleClearConfirm = useCallback(() => {
    setDialogVisible(false)
    void clearHistoryAction(ctx)
  }, [])

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenMenu}
          testID='history-header-menu'
          accessibilityLabel='Меню истории'
        >
          <MaterialCommunityIcons size={ICON_SIZE} name='dots-vertical' color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      <HistoryHeaderMenuDropdown
        anchor={menuAnchor}
        visible={menuVisible}
        onClear={handleClearOption}
        onClose={() => setMenuVisible(false)}
      />

      <ConfirmDialog
        title={CLEAR_TITLE}
        message={CLEAR_MESSAGE}
        visible={dialogVisible}
        onConfirm={handleClearConfirm}
        confirmText={CLEAR_CONFIRM_TEXT}
        onCancel={() => setDialogVisible(false)}
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
