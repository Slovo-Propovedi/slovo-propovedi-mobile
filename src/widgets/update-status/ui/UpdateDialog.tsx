import { useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { Modal, Text, View } from 'react-native'
import { useUpdateInstall } from 'features/app-update'
import {
  GENERIC_ERROR_MESSAGE,
  openInstallPermissionSettings,
  type UpdateErrorKind,
} from 'shared/lib/update-service'
import {
  isBusyUpdateState,
  latestVersionAtom,
  releaseUrlAtom,
  type UpdateState,
} from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import { openReleaseUrl } from '../lib/openReleaseUrl'
import { UpdateDialogConfirm } from './UpdateDialogConfirm'
import { UpdateDialogError } from './UpdateDialogError'
import { UpdateDialogPermission } from './UpdateDialogPermission'
import { UpdateDialogProgress } from './UpdateDialogProgress'
import { updateDialogStyles as styles } from './updateDialogStyles'

export interface UpdateDialogProps {
  onClose: () => void
  visible: boolean
}

interface DialogSnapshot {
  error: null | string
  errorKind: null | UpdateErrorKind
  progress: number
  updateState: UpdateState
}

const CONFIRM_TITLE = 'Доступно обновление'
const PERMISSION_TITLE = 'Требуется разрешение'
const PROGRESS_TITLE = 'Обновление'
const ERROR_TITLE = 'Ошибка обновления'

const getDialogTitle = (updateState: UpdateState): string => {
  if (updateState === 'error') return ERROR_TITLE
  if (updateState === 'permission') return PERMISSION_TITLE
  if (isBusyUpdateState(updateState)) return PROGRESS_TITLE
  return CONFIRM_TITLE
}

const preventClose = () => {}

export const UpdateDialog = ({ onClose, visible }: UpdateDialogProps) => {
  const { currentTheme } = useTheme()
  const [latestVersion] = useAtom(latestVersionAtom)
  const [releaseUrl] = useAtom(releaseUrlAtom)
  const { error, errorKind, progress, reset, startUpdate, updateState } = useUpdateInstall()
  const [lastShown, setLastShown] = useState<DialogSnapshot | null>(null)

  // The modal keeps rendering while it fades out: reset() in the same commit would
  // swap the content to the idle state. Render the last live state until hidden.
  const live: DialogSnapshot = { error, errorKind, progress, updateState }
  const shown = visible ? live : (lastShown ?? live)

  const handleClose = () => {
    setLastShown(live)
    onClose()
    reset()
  }

  const isBusy = isBusyUpdateState(shown.updateState)

  const handleOpenReleases = () => openReleaseUrl(releaseUrl)

  const renderContent = () => {
    if (shown.updateState === 'error')
      return (
        <UpdateDialogError
          onClose={handleClose}
          onRetry={startUpdate}
          onOpenReleases={handleOpenReleases}
          errorKind={shown.errorKind ?? 'unknown'}
          errorMessage={shown.error ?? GENERIC_ERROR_MESSAGE}
        />
      )

    if (shown.updateState === 'permission')
      return (
        <UpdateDialogPermission
          onClose={handleClose}
          onOpenSettings={openInstallPermissionSettings}
        />
      )

    if (isBusyUpdateState(shown.updateState))
      return <UpdateDialogProgress progress={shown.progress} updateState={shown.updateState} />

    return (
      <UpdateDialogConfirm
        onCancel={handleClose}
        onConfirm={startUpdate}
        latestVersion={latestVersion}
        onOpenReleases={handleOpenReleases}
      />
    )
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={isBusy ? preventClose : handleClose}
    >
      <View style={[styles.backdrop, { backgroundColor: currentTheme.backdrop }]}>
        <View style={[styles.dialog, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {getDialogTitle(shown.updateState)}
          </Text>
          {renderContent()}
        </View>
      </View>
    </Modal>
  )
}
