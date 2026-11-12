import { useAction, useAtom } from '@reatom/npm-react'
import { dismissInfoAction, globalInfoAtom } from '../../model/info-dialog'
import { ConfirmDialog } from './ConfirmDialog'

const DEFAULT_INFO_TITLE = 'Информация'

export const GlobalConfirmDialog = () => {
  const [globalInfo] = useAtom(globalInfoAtom)
  const dismissInfo = useAction(dismissInfoAction)

  // Dismiss first so the dialog is gone before the caller restores focus or
  // other UI it lost to the modal.
  const handleDismiss = () => {
    const onDismiss = globalInfo?.onDismiss

    dismissInfo()
    onDismiss?.()
  }

  return (
    <ConfirmDialog
      hideCancel
      confirmText='Понятно'
      onCancel={handleDismiss}
      onConfirm={handleDismiss}
      visible={globalInfo !== null}
      message={globalInfo?.message ?? ''}
      title={globalInfo?.title ?? DEFAULT_INFO_TITLE}
    />
  )
}
