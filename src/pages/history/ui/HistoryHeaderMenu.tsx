import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { clearHistoryAction } from 'entities/listening-history'
import { ctx } from 'shared/lib/reatom-ctx'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { FONT_SIZES, RADIUSES, useTheme } from 'shared/ui/themed'

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
      <TouchableOpacity
        style={styles.button}
        testID='history-header-menu'
        accessibilityLabel='Меню истории'
        onPress={() => setMenuVisible(true)}
      >
        <MaterialCommunityIcons size={ICON_SIZE} name='dots-vertical' color={currentTheme.text} />
      </TouchableOpacity>

      {menuVisible && (
        <Modal transparent onRequestClose={() => setMenuVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
            <Pressable
              accessibilityRole='button'
              onPress={handleClearOption}
              style={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
            >
              <MaterialCommunityIcons
                size={18}
                name='delete-outline'
                color={currentTheme.text}
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: currentTheme.text }]}>
                Очистить историю
              </Text>
            </Pressable>
          </Pressable>
        </Modal>
      )}

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
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: FONT_SIZES.base,
  },
  button: {
    alignItems: 'center',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  dropdown: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    elevation: 8,
    flexDirection: 'row',
    minWidth: 180,
    paddingVertical: 12,
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: 50,
  },
  overlay: { flex: 1 },
})
