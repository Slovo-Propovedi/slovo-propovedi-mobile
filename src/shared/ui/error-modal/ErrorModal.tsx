import { MaterialCommunityIcons } from '@expo/vector-icons'
import { type ReactNode } from 'react'
import { Clipboard } from 'react-native'
import { ConfirmDialog } from '../confirm-dialog'
import { COLORS } from '../theme/colors'

export interface ErrorModalProps {
  error: Error | null
  onClose: () => void
  showCopyButton?: boolean
  visible: boolean
}

const ICON_SIZE = 24

export const ErrorModal = ({ error, onClose, showCopyButton = true, visible }: ErrorModalProps) => {
  const handleCopy = () => {
    if (!error) return

    const errorText = `Error: ${error.message}\n\nStack trace:\n${error.stack || 'No stack trace available'}`

    Clipboard.setString(errorText)
  }

  const icon: ReactNode = (
    <MaterialCommunityIcons size={ICON_SIZE} name='alert-circle' color={COLORS.error} />
  )

  return (
    <ConfirmDialog
      icon={icon}
      title='Ошибка'
      visible={visible}
      onConfirm={onClose}
      confirmText='Закрыть'
      onCancel={handleCopy}
      cancelText='Скопировать'
      hideCancel={!showCopyButton}
      message={error?.message || 'Произошла ошибка'}
      cancelIcon={
        <MaterialCommunityIcons size={ICON_SIZE} name='content-copy' color={COLORS.black} />
      }
    />
  )
}
