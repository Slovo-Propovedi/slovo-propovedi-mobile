import { forwardRef, type ReactNode } from 'react'
import { type StyleProp, type ViewInstance, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { PressableButton, type PressableButtonProps } from '../pressable-button/PressableButton'
import { RADIUSES } from '../theme/themed'
import { type BlurTargetRef } from './blurTargets'
import { createGlassStyles } from './glass'
import { GlassSurface } from './GlassSurface'

const AnimatedPressable = Animated.createAnimatedComponent(PressableButton)

/**
 * The shared host frame of every bottom-chrome island: one host, one
 * `GlassSurface`, one content slot. Using it guarantees all islands share the
 * literal same glass structure — only the per-surface geometry and content
 * differ.
 *
 * Скругление всегда равно половине высоты элемента: платформа клампит
 * full-round до min(w,h)/2, отдельные константы радиуса не нужны.
 */
export const GlassIsland = forwardRef<
  ViewInstance,
  {
    /** Hides the island's subtree from assistive tech, including the hidden close slot. */
    accessibilityElementsHidden?: boolean
    /** Role of the pressable host (default 'button'); pass 'link' on web when it contains a button. */
    accessibilityRole?: PressableButtonProps['accessibilityRole']
    animatedStyle?: StyleProp<AnimatedStyle<ViewStyle>>
    /** Explicit backdrop; `undefined` inherits the provider, `null` opts out of it. */
    blurTarget?: BlurTargetRef | null
    children: ReactNode
    hostStyle?: StyleProp<ViewStyle>
    importantForAccessibility?: 'auto' | 'no-hide-descendants' | 'no' | 'yes'
    isLight: boolean
    onPress?: () => void
    pointerEvents?: 'auto' | 'box-none' | 'box-only' | 'none'
  }
>((props, ref) => {
  const {
    accessibilityElementsHidden,
    accessibilityRole,
    animatedStyle,
    blurTarget,
    children,
    hostStyle,
    importantForAccessibility,
    isLight,
    onPress,
    pointerEvents,
  } = props
  const radius = RADIUSES.round
  const hostStyles = [hostStyle, createGlassStyles(isLight, radius).containerPlain, animatedStyle]
  const glass = (
    <GlassSurface
      radius={radius}
      isLight={isLight}
      blurTarget={blurTarget}
      key={isLight ? 'light' : 'dark'}
    />
  )
  const pointerProps = pointerEvents === undefined ? {} : { pointerEvents }

  if (onPress)
    return (
      <AnimatedPressable
        ref={ref}
        onPress={onPress}
        style={hostStyles}
        accessibilityRole={accessibilityRole}
        importantForAccessibility={importantForAccessibility}
        accessibilityElementsHidden={accessibilityElementsHidden}
        {...pointerProps}
      >
        {glass}
        {children}
      </AnimatedPressable>
    )

  return (
    <Animated.View
      ref={ref}
      style={hostStyles}
      importantForAccessibility={importantForAccessibility}
      accessibilityElementsHidden={accessibilityElementsHidden}
      {...pointerProps}
    >
      {glass}
      {children}
    </Animated.View>
  )
})
GlassIsland.displayName = 'GlassIsland'
