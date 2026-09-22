import { Platform } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { createMarqueeGesture } from './createMarqueeGesture'
import { HOLD_MS } from './marquee-utils'

const { __gestureMock } = jest.requireMock('react-native-gesture-handler') as {
  __gestureMock: {
    pan: () => Record<string, ((...args: unknown[]) => unknown) | undefined>
    reset: () => void
  }
}

describe('createMarqueeGesture', () => {
  const translateX = { value: 0 } as SharedValue<number>
  const startX = { value: 0 } as SharedValue<number>
  const maxOffset = { value: 100 } as SharedValue<number>
  const didDrag = { value: false } as SharedValue<boolean>
  const marqueeArmed = { value: false } as SharedValue<boolean>
  const clockPaused = { value: true } as SharedValue<boolean>
  const startIdleMarquee = jest.fn()

  beforeEach(() => {
    didDrag.value = false
    marqueeArmed.value = false
    clockPaused.value = true
    startIdleMarquee.mockClear()
    __gestureMock.reset()
  })

  test('marks a drag and pauses the clock on pan activation', () => {
    // The running frame clock must be paused on activation, otherwise it would
    // fight the scrub every frame (the withRepeat loop used to be cancelled).
    clockPaused.value = false
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})

    expect(didDrag.value).toBe(true)
    expect(clockPaused.value).toBe(true)
  })

  test('neither arms nor starts the loop for sub-threshold finger jitter', () => {
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onEnd?.({ translationX: 2 })

    expect(didDrag.value).toBe(false)
    expect(marqueeArmed.value).toBe(false)
    expect(clockPaused.value).toBe(true)
    expect(startIdleMarquee).not.toHaveBeenCalled()
  })

  test('resumes an armed loop after sub-threshold finger jitter', () => {
    // A slow tap (long-press, <3px) on an armed title activates the pan and
    // pauses the clock in onStart; onEnd must resume it from phase 0 instead
    // of leaving the loop frozen forever.
    marqueeArmed.value = true
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onEnd?.({ translationX: 2 })

    expect(didDrag.value).toBe(false)
    expect(startIdleMarquee).toHaveBeenCalled()
  })

  test('resumes an armed loop when the gesture is cancelled', () => {
    // onFinalize(!success) otherwise only resets didDrag, leaving the onStart
    // pause in place (e.g. an outer handler steals the pointer).
    marqueeArmed.value = true
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onFinalize?.({}, false)

    expect(didDrag.value).toBe(false)
    expect(startIdleMarquee).toHaveBeenCalled()
  })

  test('arms the gate and starts the loop after a real drag', () => {
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onEnd?.({ translationX: 5 })

    expect(didDrag.value).toBe(true)
    expect(marqueeArmed.value).toBe(true)
    expect(startIdleMarquee).toHaveBeenCalled()
  })

  test('resets didDrag on finalize after a cancelled gesture', () => {
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onEnd?.({ translationX: 5 }, false)
    __gestureMock.pan().onFinalize?.({}, false)

    expect(didDrag.value).toBe(false)
  })

  test('keeps didDrag armed on finalize after a successful drag', () => {
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    __gestureMock.pan().onStart?.({})
    __gestureMock.pan().onEnd?.({ translationX: 5 }, true)
    __gestureMock.pan().onFinalize?.({}, true)

    expect(didDrag.value).toBe(true)
  })

  test('uses minDistance activation on web (no long-press hold)', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      createMarqueeGesture(
        translateX,
        startX,
        maxOffset,
        startIdleMarquee,
        didDrag,
        marqueeArmed,
        clockPaused,
      )

      expect(__gestureMock.pan().minDistance).toBe(10)
      expect(__gestureMock.pan().failOffsetY).toEqual([-14, 14])
      expect(__gestureMock.pan().activateAfterLongPress).toBeUndefined()
    } finally {
      restorePlatform.restore()
    }
  })

  test('keeps long-press activation on native', () => {
    createMarqueeGesture(
      translateX,
      startX,
      maxOffset,
      startIdleMarquee,
      didDrag,
      marqueeArmed,
      clockPaused,
    )

    expect(__gestureMock.pan().activateAfterLongPress).toBe(HOLD_MS)
    expect(__gestureMock.pan().minDistance).toBeUndefined()
    expect(__gestureMock.pan().failOffsetY).toBeUndefined()
  })
})
