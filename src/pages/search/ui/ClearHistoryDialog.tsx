import { useAction, useAtom } from '@reatom/npm-react'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import {
  closeClearHistoryDialog,
  confirmClearHistory,
  isClearHistoryDialogVisibleAtom,
} from '../lib/clearHistoryDialog'

const DIALOG_TITLE = 'Очистить историю поиска?'
const DIALOG_MESSAGE = 'Сохранённые недавние поиски будут удалены.'
const DIALOG_CONFIRM = 'Очистить'

// Page-level host: mounted by SearchScreen in every pose, so the dialog outlives
// the «Недавние поиски» section that raised it.
export const ClearHistoryDialog = () => {
  const [visible] = useAtom(isClearHistoryDialogVisibleAtom)
  const close = useAction(closeClearHistoryDialog)
  const confirm = useAction(confirmClearHistory)

  return (
    <ConfirmDialog
      onCancel={close}
      visible={visible}
      onConfirm={confirm}
      title={DIALOG_TITLE}
      message={DIALOG_MESSAGE}
      confirmText={DIALOG_CONFIRM}
    />
  )
}
