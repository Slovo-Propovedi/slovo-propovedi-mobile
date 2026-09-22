import { renderHook } from '@testing-library/react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useMarqueeAnimation } from './useMarqueeAnimation'

interface FrameRegistration {
  callback: (info: {
    timeSinceFirstFrame: number
    timeSincePreviousFrame: null | number
    timestamp: number
  }) => void
  setActive: jest.Mock
}

const { __frameCallbacks } = jest.requireMock('react-native-reanimated') as {
  __frameCallbacks: FrameRegistration[]
}

const latestFrameCallback = () => {
  const registration = __frameCallbacks.at(-1)
  if (!registration) throw new Error('No frame callback registered')
  return registration
}

const driveFrame = (delta: null | number) => {
  latestFrameCallback().callback({
    timeSinceFirstFrame: 0,
    timeSincePreviousFrame: delta,
    timestamp: 0,
  })
}

// Twenty 100ms ticks fill MARQUEE_PAUSE (2000ms) exactly, leaving the clock at
// the boundary of the scroll phase.
const fillPause = () => {
  for (let i = 0; i < 20; i++) driveFrame(100)
}

describe('useMarqueeAnimation', () => {
  test('starts the frame-clock loop without a drag when autoStart is set', async () => {
    // Player titles opt into autoStart: eligibility alone pre-arms the gate, so
    // useAnimatedReaction can start the loop as soon as measurement overflows.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(
        containerWidth,
        textWidth,
        needsMarquee,
        'text',
        false,
        false,
        true,
        true,
      ),
    )

    result.current.startIdleMarquee()
    expect(result.current.clockPaused.value).toBe(false)

    fillPause()
    expect(result.current.translateX.value).toBe(0)

    driveFrame(100)
    expect(result.current.translateX.value).toBeLessThan(0)
  })

  test('keeps the loop idle until a drag arms the gate when autoStart is false', async () => {
    // Sliders and track lists default to the drag gate: an overflowing title
    // stays static (clock paused, translateX reset) until a real drag arms it.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(
        containerWidth,
        textWidth,
        needsMarquee,
        'text',
        false,
        false,
        false,
        true,
      ),
    )

    expect(result.current.marqueeArmed.value).toBe(false)
    result.current.startIdleMarquee()
    expect(result.current.clockPaused.value).toBe(true)
    expect(result.current.translateX.value).toBe(0)

    fillPause()
    driveFrame(100)
    expect(result.current.translateX.value).toBe(0)

    result.current.marqueeArmed.value = true
    result.current.startIdleMarquee()
    expect(result.current.clockPaused.value).toBe(false)
    expect(result.current.translateX.value).toBe(0)

    fillPause()
    driveFrame(100)
    expect(result.current.translateX.value).toBeLessThan(0)
  })

  test('stops the clock and resets to static when needsMarquee drops to false', async () => {
    // The reported bug: a fitting title scrolled because the loop kept running
    // after maxOffset dropped to ~0 (container grew / text shrank). The guard
    // in startIdleMarquee must pause the clock and reset translateX to 0.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(
        containerWidth,
        textWidth,
        needsMarquee,
        'text',
        false,
        false,
        true,
        true,
      ),
    )

    result.current.startIdleMarquee()
    expect(result.current.clockPaused.value).toBe(false)

    needsMarquee.value = false
    result.current.startIdleMarquee()
    expect(result.current.clockPaused.value).toBe(true)
    expect(result.current.translateX.value).toBe(0)

    fillPause()
    driveFrame(100)
    expect(result.current.translateX.value).toBe(0)
  })

  test('activates the frame clock only while the row overflows (needsRepeat)', async () => {
    // JS-side lifecycle: a fitting row (needsRepeat false) never activates the
    // callback; overflow activates it. Worklet pauses handle drags separately.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { rerender } = await renderHook(
      ({ needsRepeat }: { needsRepeat: boolean }) =>
        useMarqueeAnimation(
          containerWidth,
          textWidth,
          needsMarquee,
          'text',
          false,
          false,
          true,
          needsRepeat,
        ),
      { initialProps: { needsRepeat: false } },
    )

    expect(latestFrameCallback().setActive).toHaveBeenLastCalledWith(false)

    await rerender({ needsRepeat: true })
    expect(latestFrameCallback().setActive).toHaveBeenLastCalledWith(true)
  })

  test('resets the phase and pauses the clock when the text changes', async () => {
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { rerender, result } = await renderHook(
      ({ text }: { text: string }) =>
        useMarqueeAnimation(
          containerWidth,
          textWidth,
          needsMarquee,
          text,
          false,
          false,
          false,
          true,
        ),
      { initialProps: { text: 'first' } },
    )

    result.current.marqueeArmed.value = true
    result.current.startIdleMarquee()
    fillPause()
    driveFrame(100)
    expect(result.current.translateX.value).toBeLessThan(0)

    await rerender({ text: 'second' })
    expect(result.current.translateX.value).toBe(0)
    expect(result.current.clockPaused.value).toBe(true)

    fillPause()
    driveFrame(100)
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
      useMarqueeAnimation(
        containerWidth,
        textWidth,
        needsMarquee,
        'text',
        false,
        false,
        false,
        false,
      ),
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
      useMarqueeAnimation(
        containerWidth,
        textWidth,
        needsMarquee,
        'text',
        false,
        true,
        false,
        false,
      ),
    )

    const animatedStyle = result.current.animatedStyle as { width?: '100%' | number }
    expect(animatedStyle.width).toBe(252) // 250 + STATIC_WIDTH_SAFETY_PX
  })
})
