import { useAtom } from '@reatom/npm-react'
import { Modal, Text, View } from 'react-native'
import { type UpdateState, useUpdateInstall } from 'features/app-update'
import { latestVersionAtom, releaseUrlAtom } from 'shared/model'
import { openReleaseUrl } from '../lib/openReleaseUrl'
import { UpdateDialogConfirm } from './UpdateDialogConfirm'
import { UpdateDialogError } from './UpdateDialogError'
import { UpdateDialogProgress } from './UpdateDialogProgress'
import { updateDialogStyles as styles } from './updateDialogStyles'

export interface UpdateDialogProps {
  onClose: () => void
  visible: boolean
}

const CONFIRM_TITLE = 'Доступно обновление'
const PROGRESS_TITLE = 'Обновление'
const ERROR_TITLE = 'Ошибка обновления'

const BUSY_STATES: UpdateState[] = ['downloading', 'extracting', 'installing']

const isBusyState = (updateState: UpdateState): boolean => BUSY_STATES.includes(updateState)

const getDialogTitle = (updateState: UpdateState): string => {
  if (updateState === 'error') return ERROR_TITLE
  if (isBusyState(updateState)) return PROGRESS_TITLE
  return CONFIRM_TITLE
}

const preventClose = () => {}

export const UpdateDialog = ({ onClose, visible }: UpdateDialogProps) => {
  const [latestVersion] = useAtom(latestVersionAtom)
  const [releaseUrl] = useAtom(releaseUrlAtom)
  const { error, progress, reset, startUpdate, updateState } = useUpdateInstall()

  if (!visible) return null

  const isBusy = isBusyState(updateState)

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleOpenReleases = () => openReleaseUrl(releaseUrl)

  const renderContent = () => {
    if (updateState === 'error')
      return (
        <UpdateDialogError
          errorMessage={error}
          onClose={handleClose}
          onOpenReleases={handleOpenReleases}
        />
      )

    if (isBusy) return <UpdateDialogProgress progress={progress} updateState={updateState} />

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
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{getDialogTitle(updateState)}</Text>
          {renderContent()}
        </View>
      </View>
    </Modal>
  )
}
