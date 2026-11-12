import { useAction, useAtom } from '@reatom/npm-react'
import { dismissInfoAction, globalInfoAtom } from '../../model/info-dialog'
import { ConfirmDialog } from './ConfirmDialog'

const DEFAULT_INFO_TITLE = 'Информация'

export const GlobalConfirmDialog = () => {
  const [globalInfo] = useAtom(globalInfoAtom)
  const dismissInfo = useAction(dismissInfoAction)

  return (
    <ConfirmDialog
      hideCancel
      confirmText='Понятно'
      onCancel={dismissInfo}
      onConfirm={dismissInfo}
      visible={globalInfo !== null}
      message={globalInfo?.message ?? ''}
      title={globalInfo?.title ?? DEFAULT_INFO_TITLE}
    />
  )
}
