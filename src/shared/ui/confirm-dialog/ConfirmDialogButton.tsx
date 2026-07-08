import { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from '../themed'

export interface ConfirmDialogButtonProps {
  color?: string
  icon?: ReactNode
  isConfirm?: boolean
  onPress: () => void
  testID?: string
  text: string
}

export const ConfirmDialogButton = ({
  color,
  icon,
  isConfirm,
  onPress,
  testID,
  text,
}: ConfirmDialogButtonProps) => {
  if (!onPress || !text) return null

  const buttonStyle = isConfirm
    ? [styles.confirmButton, { backgroundColor: color ?? COLORS.primary }]
    : styles.cancelButton

  const textStyle = isConfirm ? styles.confirmButtonText : styles.cancelButtonText

  return (
    <Pressable testID={testID} onPress={onPress} style={buttonStyle}>
      <View style={styles.buttonContent}>
        {icon}
        <Text style={textStyle}>{text}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    justifyContent: 'center',
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
})

export default ConfirmDialogButton
