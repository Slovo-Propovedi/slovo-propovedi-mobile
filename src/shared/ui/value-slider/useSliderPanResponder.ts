import { type RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { type LayoutChangeEvent, PanResponder, type View } from 'react-native'

// toFixed precision: kills float noise from step math (0.05-step drags would
// otherwise produce values like 0.35000000000000003).
const VALUE_PRECISION = 2

type PanResponderInstance = ReturnType<typeof PanResponder.create>

interface SliderGeometry {
  containerPageX: number
  width: number
}

interface UseSliderPanResponderParams {
  disabled: boolean
  max: number
  min: number
  onChange: (value: number) => void
  onComplete?: (value: number) => void
  step: number
}

interface UseSliderPanResponderResult {
  containerRef: RefObject<null | View>
  handleLayout: (event: LayoutChangeEvent) => void
  panResponder: PanResponderInstance
  trackWidth: number
}

// Snap a raw position onto the step grid, clamped to the grid start (min).
export const quantize = (raw: number, min: number, step: number): number => {
  if (step <= 0) return raw

  const stepped = min + Math.round((raw - min) / step) * step

  return Number(stepped.toFixed(VALUE_PRECISION))
}

export const useSliderPanResponder = ({
  disabled,
  max,
  min,
  onChange,
  onComplete,
  step,
}: UseSliderPanResponderParams): UseSliderPanResponderResult => {
  const [geometry, setGeometry] = useState<null | SliderGeometry>(null)
  const containerRef = useRef<null | View>(null)
  const latestValueRef = useRef(min)
  const hasGestureValueRef = useRef(false)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout

    // Measure via the node ref, not event.currentTarget: react-native-web's
    // onLayout event carries no currentTarget, so reading .measure() on it throws.
    containerRef.current?.measure((_x, _y, _w, _h, pageX) => {
      setGeometry({ containerPageX: pageX, width })
    })
  }, [])

  const valueFromPageX = useCallback(
    (pageX: number): null | number => {
      if (!geometry || geometry.width === 0) return null

      const x = Math.max(0, Math.min(pageX - geometry.containerPageX, geometry.width))

      return quantize(min + (x / geometry.width) * (max - min), min, step)
    },
    [geometry, max, min, step],
  )

  /* eslint-disable react-hooks/refs -- intentional: the gesture refs are only read/written inside PanResponder gesture callbacks, never during render */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !disabled && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: event => {
          const value = valueFromPageX(event.nativeEvent.pageX)

          if (value === null) {
            hasGestureValueRef.current = false
            return
          }

          hasGestureValueRef.current = true
          latestValueRef.current = value
          onChange(value)
        },
        onPanResponderMove: event => {
          const value = valueFromPageX(event.nativeEvent.pageX)

          if (value === null) return

          // Grant may have started before geometry existed (flag set false):
          // from the first real move the gesture owns a committable value.
          hasGestureValueRef.current = true
          latestValueRef.current = value
          onChange(value)
        },
        onPanResponderRelease: () => {
          if (hasGestureValueRef.current) onComplete?.(latestValueRef.current)
        },
        onPanResponderTerminate: () => {
          if (hasGestureValueRef.current) onComplete?.(latestValueRef.current)
        },
        onPanResponderTerminationRequest: () => true,
        onStartShouldSetPanResponder: () => !disabled,
      }),
    [disabled, onChange, onComplete, valueFromPageX],
  )
  /* eslint-enable react-hooks/refs -- re-enabling after PanResponder ref block */

  return { containerRef, handleLayout, panResponder, trackWidth: geometry?.width ?? 0 }
}
