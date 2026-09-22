import { forwardRef, type ReactNode } from 'react'
import { StyleSheet, type View } from 'react-native'
import { MIN_TOUCH_TARGET } from 'shared/ui/theme'
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
        styles.base,
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
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
  },
  pressed: {
    opacity: 0.6,
  },
})
