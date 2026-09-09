import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS, useTheme } from 'shared/ui/theme'

const MARK_TITLE = 'Пометить прослушанными?'
const MARK_MESSAGE = 'Все проповеди этого плейлиста будут помечены прослушанными.'
const MARK_CONFIRM_TEXT = 'Пометить'

const REMOVE_TITLE = 'Удалить из истории?'
const REMOVE_MESSAGE =
  'Весь прогресс прослушивания проповедей этого плейлиста будет удалён из истории.'
const REMOVE_CONFIRM_TEXT = 'Удалить'

interface PlaylistHistoryDialogsProps {
  markDialogVisible: boolean
  onMarkCancel: () => void
  onMarkConfirm: () => void
  onRemoveCancel: () => void
  onRemoveConfirm: () => void
  removeDialogVisible: boolean
}

export const PlaylistHistoryDialogs = ({
  markDialogVisible,
  onMarkCancel,
  onMarkConfirm,
  onRemoveCancel,
  onRemoveConfirm,
  removeDialogVisible,
}: PlaylistHistoryDialogsProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <ConfirmDialog
        title={MARK_TITLE}
        cancelText='Отмена'
        message={MARK_MESSAGE}
        onCancel={onMarkCancel}
        onConfirm={onMarkConfirm}
        visible={markDialogVisible}
        confirmText={MARK_CONFIRM_TEXT}
        confirmColor={currentTheme.primary}
      />
      <ConfirmDialog
        cancelText='Отмена'
        title={REMOVE_TITLE}
        message={REMOVE_MESSAGE}
        onCancel={onRemoveCancel}
        onConfirm={onRemoveConfirm}
        confirmColor={COLORS.error}
        visible={removeDialogVisible}
        confirmText={REMOVE_CONFIRM_TEXT}
      />
    </>
  )
}
