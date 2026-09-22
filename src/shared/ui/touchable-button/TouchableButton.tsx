import { type ComponentRef, forwardRef } from 'react'
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native'
import { hapticLight } from 'shared/lib/haptics'

// On web react-native-web only renders a real <button> (Vimium hints and
// browser semantics depend on it) when accessibilityRole='button' is passed
// explicitly, so defaulting it here keeps TouchableOpacity-based controls
// hintable without spelling the role at every call site.
export interface TouchableButtonProps extends Omit<TouchableOpacityProps, 'accessibilityRole'> {
  accessibilityRole?: TouchableOpacityProps['accessibilityRole']
  /** Skips the built-in press-in haptic (for already-selected tabs). */
  hapticDisabled?: boolean
}

export const TouchableButton = forwardRef<
  ComponentRef<typeof TouchableOpacity>,
  TouchableButtonProps
>(({ accessibilityRole, disabled, hapticDisabled, onPressIn, ...props }, ref) => (
  <TouchableOpacity
    {...props}
    ref={ref}
    disabled={disabled}
    accessibilityRole={accessibilityRole ?? 'button'}
    onPressIn={event => {
      if (!disabled && !hapticDisabled) hapticLight()
      onPressIn?.(event)
    }}
  />
))
TouchableButton.displayName = 'TouchableButton'
