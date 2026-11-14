import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { dismissInfoAction, type GlobalInfo, globalInfoAtom } from '../../model/info-dialog'
import { ConfirmDialog } from './ConfirmDialog'

const DEFAULT_INFO_TITLE = 'Информация'

export const GlobalConfirmDialog = () => {
  const [globalInfo] = useAtom(globalInfoAtom)
  const dismissInfo = useAction(dismissInfoAction)
  const [lastShownInfo, setLastShownInfo] = useState<GlobalInfo | null>(null)

  // Keep the previous message on screen while the dialog fades out: dismissing
  // clears the atom immediately, but the modal stays visible for the animation.
  if (globalInfo !== null && globalInfo !== lastShownInfo) setLastShownInfo(globalInfo)

  const shownInfo = globalInfo ?? lastShownInfo

  return (
    <ConfirmDialog
      hideCancel
      confirmText='Понятно'
      onCancel={dismissInfo}
      onConfirm={dismissInfo}
      visible={globalInfo !== null}
      message={shownInfo?.message ?? ''}
      title={shownInfo?.title ?? DEFAULT_INFO_TITLE}
    />
  )
}
