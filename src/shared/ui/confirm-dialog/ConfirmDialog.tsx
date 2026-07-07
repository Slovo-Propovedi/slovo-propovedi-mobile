import { Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'
import type { ReactNode } from 'react'

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
              <Pressable onPress={onCancel} style={styles.cancelButton}>
                <View style={styles.buttonContent}>
                  {cancelIcon}
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </View>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButton, { backgroundColor: confirmColor }]}
            >
              <View style={styles.buttonContent}>
                {confirmIcon}
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: INDENTS.high,
    paddingTop: statusBarHeight,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    justifyContent: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
  confirmButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: INDENTS.middle,
  },
  confirmButtonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialog: { backgroundColor: COLORS.surface, borderRadius: RADIUSES.middle, padding: INDENTS.high },
  iconContainer: { marginBottom: INDENTS.medium },
  message: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
    marginBottom: INDENTS.high,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
