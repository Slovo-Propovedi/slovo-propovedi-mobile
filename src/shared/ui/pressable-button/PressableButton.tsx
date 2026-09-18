import { forwardRef } from 'react'
import { Pressable, type PressableProps, type View } from 'react-native'
import { hapticLight } from 'shared/lib/haptics'

// On web react-native-web only renders a real <button> (Vimium hints and
// browser semantics depend on it) when accessibilityRole='button' is passed
// explicitly, so defaulting it here keeps interactive controls hintable
// without spelling the role at every call site.
export interface PressableButtonProps extends Omit<PressableProps, 'accessibilityRole'> {
  accessibilityRole?: PressableProps['accessibilityRole']
}

export const PressableButton = forwardRef<View, PressableButtonProps>(
  ({ accessibilityRole, disabled, onPressIn, ...props }, ref) => (
    <Pressable
      {...props}
      ref={ref}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? 'button'}
      onPressIn={event => {
        if (!disabled) hapticLight()
        onPressIn?.(event)
      }}
    />
  ),
)
PressableButton.displayName = 'PressableButton'
