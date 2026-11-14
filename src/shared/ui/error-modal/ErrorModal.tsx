import { MaterialCommunityIcons } from '@expo/vector-icons'
import { setStringAsync } from 'expo-clipboard'
import { type ReactNode } from 'react'
import { ConfirmDialog } from '../confirm-dialog/ConfirmDialog'
import { COLORS } from '../theme/colors'

const ICON_SIZE = 24

export const ErrorModal = ({
  error,
  onClose,
  showCopyButton = true,
  visible,
}: {
  error: Error | null
  onClose: () => void
  showCopyButton?: boolean
  visible: boolean
}) => {
  const handleCopy = () => {
    if (!error) return

    const errorText = `Error: ${error.message}\n\nStack trace:\n${error.stack || 'No stack trace available'}`

    // Clipboard copy is cosmetic: a rejected write is not actionable for the user.
    void setStringAsync(errorText).catch(() => {})
  }

  const icon: ReactNode = (
    <MaterialCommunityIcons size={ICON_SIZE} name='alert-circle' color={COLORS.error} />
  )

  return (
    <ConfirmDialog
      icon={icon}
      title='Ошибка'
      visible={visible}
      onEscape={onClose}
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
