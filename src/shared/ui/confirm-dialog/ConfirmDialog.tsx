import { type ReactNode } from 'react'
import { Modal, Text, View } from 'react-native'
import { COLORS } from 'shared/ui/themed'
import { ConfirmDialogButton } from './ConfirmDialogButton'
import { styles } from './styles'

export interface ConfirmDialogProps {
  cancelIcon?: ReactNode
  cancelText?: string
  confirmColor?: string
  confirmIcon?: ReactNode
  confirmText?: string
  hideCancel?: boolean
  icon?: ReactNode
  message: string | string[]
  onCancel: () => void
  onConfirm: () => void
  title: string
  visible: boolean
}

export const ConfirmDialog = ({
  cancelIcon,
  cancelText = 'Отмена',
  confirmColor = COLORS.primary,
  confirmIcon,
  confirmText = 'ОК',
  hideCancel = false,
  icon,
  message,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmDialogProps) => {
  const messages = Array.isArray(message) ? message : [message]

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
          {messages.map((msg, index) => (
            <Text key={index} style={styles.message}>
              {msg}
            </Text>
          ))}
          <View style={styles.buttons}>
            {!hideCancel && (
              <ConfirmDialogButton
                icon={cancelIcon}
                isConfirm={false}
                text={cancelText}
                onPress={onCancel}
              />
            )}
            <ConfirmDialogButton
              isConfirm
              icon={confirmIcon}
              text={confirmText}
              onPress={onConfirm}
              color={confirmColor}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}
