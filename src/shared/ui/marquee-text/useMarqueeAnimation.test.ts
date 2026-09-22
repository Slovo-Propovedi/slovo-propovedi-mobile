import { renderHook } from '@testing-library/react-native'
import { type SharedValue, withTiming } from 'react-native-reanimated'
import { useMarqueeAnimation } from './useMarqueeAnimation'

describe('useMarqueeAnimation', () => {
  beforeEach(() => {
    jest.mocked(withTiming).mockClear()
  })

  test('starts the loop without a drag when autoStart is set', async () => {
    // Player titles opt into autoStart: eligibility alone pre-arms the gate, so
    // useAnimatedReaction can start the loop as soon as measurement overflows.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, false, true),
    )

    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).toHaveBeenCalled()
  })

  test('keeps the loop idle until a drag arms the gate when autoStart is false', async () => {
    // Sliders and track lists default to the drag gate: an overflowing title
    // stays static (translateX reset) until a real drag sets marqueeArmed.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, false, false),
    )

    expect(result.current.marqueeArmed.value).toBe(false)
    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).not.toHaveBeenCalled()
    expect(result.current.translateX.value).toBe(0)

    result.current.marqueeArmed.value = true
    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).toHaveBeenCalled()
  })

  test('stops the loop and resets to static when needsMarquee drops to false', async () => {
    // The reported bug: a fitting title scrolled because the loop kept running
    // after maxOffset dropped to ~0 (container grew / text shrank). The guard
    // in startIdleMarquee must stop the loop and reset translateX to 0.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, false, true),
    )

    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).toHaveBeenCalled()

    jest.mocked(withTiming).mockClear()
    needsMarquee.value = false
    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).not.toHaveBeenCalled()
    expect(result.current.translateX.value).toBe(0)
  })

  test('keeps the default static row at marquee width (2x textWidth + spacer)', async () => {
    // The static state reuses the marquee geometry on every platform so the row
    // is always wide enough for the full single-line text; the container's
    // overflow: 'hidden' does the cutting, exactly like the first loop frame.
    // Pinned at the hook level: the reanimated mock resets shared values on
    // re-render, so the component test cannot observe the computed width.
    const containerWidth = { value: 300 } as SharedValue<number>
    const textWidth = { value: 300 } as SharedValue<number>
    const needsMarquee = { value: false } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, false, false),
    )

    // The reanimated mock returns the computed style object; the real hook
    // returns an AnimatedStyleHandle, so the width is read via a test cast.
    const animatedStyle = result.current.animatedStyle as { width?: '100%' | number }
    expect(animatedStyle.width).toBe(650) // 2 * 300 + REPEAT_SPACER
  })

  test('sizes the centered static row to text width plus safety margin on native', async () => {
    // centerWhenStatic splits by platform: '100%' on web, textWidth +
    // STATIC_WIDTH_SAFETY_PX on native (the margin absorbs Yoga pixel-grid
    // rounding so the centered row never wraps).
    const containerWidth = { value: 250 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: false } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, true, false),
    )

    const animatedStyle = result.current.animatedStyle as { width?: '100%' | number }
    expect(animatedStyle.width).toBe(252) // 250 + STATIC_WIDTH_SAFETY_PX
  })
})
