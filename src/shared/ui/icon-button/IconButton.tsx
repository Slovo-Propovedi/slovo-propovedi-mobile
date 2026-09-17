import { forwardRef, type ReactNode } from 'react'
import { StyleSheet, type View } from 'react-native'
import { PressableButton, type PressableButtonProps } from '../pressable-button'

// Icon-only buttons must carry a mandatory accessibilityLabel and take their
// icon via the Icon prop (children are banned). testID is rejected at the type
// level: AGENTS.md Testing Guidelines require identifying elements by
// role/label/text, never by testID.
type IconButtonProps = {
  accessibilityLabel: string
  Icon: ReactNode
  testID?: never
} & Omit<PressableButtonProps, 'accessibilityLabel' | 'children' | 'testID'>

export const IconButton = forwardRef<View, IconButtonProps>(
  ({ accessibilityLabel, Icon, style, ...rest }, ref) => (
    <PressableButton
      {...rest}
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      {Icon}
    </PressableButton>
  ),
)
IconButton.displayName = 'IconButton'

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
})
