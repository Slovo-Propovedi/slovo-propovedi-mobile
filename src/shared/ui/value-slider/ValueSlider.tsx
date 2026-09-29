import { type AccessibilityActionEvent, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { quantize, useSliderPanResponder } from './useSliderPanResponder'
import { createValueSliderStyles, THUMB_SIZE } from './valueSlider.styles'

const DEFAULT_STEP = 1

// Themed accessible value slider: tap-to-set and horizontal drag on a
// track+thumb visual. Fully controlled — onChange fires on every gesture move
// (cheap visual updates), onSlidingComplete fires once on release
// (commit/persist).
export const ValueSlider = ({
  accessibilityLabel,
  disabled = false,
  max,
  min,
  onChange,
  onSlidingComplete,
  step = DEFAULT_STEP,
  value,
}: {
  accessibilityLabel: string
  disabled?: boolean
  max: number
  min: number
  onChange: (value: number) => void
  onSlidingComplete?: (value: number) => void
  step?: number
  value: number
}) => {
  const { currentTheme } = useTheme()
  const styles = createValueSliderStyles(currentTheme)
  const { containerRef, handleLayout, panResponder, trackWidth } = useSliderPanResponder({
    disabled,
    max,
    min,
    onChange,
    onComplete: onSlidingComplete,
    step,
  })

  const range = max - min
  const progress = range > 0 ? Math.max(0, Math.min((value - min) / range, 1)) : 0

  const clampToRange = (raw: number): number => Math.max(min, Math.min(raw, max))

  // Screen-reader stepping (role `adjustable`): one step per action, committed
  // immediately — the a11y equivalent of a completed drag.
  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (disabled) return

    const actionName = event.nativeEvent.actionName
    if (actionName !== 'decrement' && actionName !== 'increment') return

    const delta = actionName === 'increment' ? step : -step
    const next = quantize(clampToRange(value + delta), min, step)

    if (next === value) return
    onChange(next)
    onSlidingComplete?.(next)
  }

  return (
    <View
      accessible
      ref={containerRef}
      onLayout={handleLayout}
      accessibilityRole='adjustable'
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ max, min, now: value }}
      onAccessibilityAction={handleAccessibilityAction}
      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
      style={[styles.trackContainer, disabled && styles.disabled]}
      accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        <View style={[styles.thumb, { left: progress * trackWidth - THUMB_SIZE / 2 }]} />
      </View>
    </View>
  )
}
