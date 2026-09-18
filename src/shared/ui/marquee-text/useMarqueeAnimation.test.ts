import { renderHook } from '@testing-library/react-native'
import { type SharedValue, withTiming } from 'react-native-reanimated'
import { useMarqueeAnimation } from './useMarqueeAnimation'

describe('useMarqueeAnimation', () => {
  beforeEach(() => {
    jest.mocked(withTiming).mockClear()
  })

  test('stops the loop and resets to static when needsMarquee drops to false', async () => {
    // The reported bug: a fitting title scrolled because the loop kept running
    // after maxOffset dropped to ~0 (container grew / text shrank). The guard
    // in startIdleMarquee must stop the loop and reset translateX to 0.
    const containerWidth = { value: 200 } as SharedValue<number>
    const textWidth = { value: 250 } as SharedValue<number>
    const needsMarquee = { value: true } as SharedValue<boolean>
    const { result } = await renderHook(() =>
      useMarqueeAnimation(containerWidth, textWidth, needsMarquee, 'text', false, false),
    )

    result.current.marqueeArmed.value = true
    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).toHaveBeenCalled()

    jest.mocked(withTiming).mockClear()
    needsMarquee.value = false
    result.current.startIdleMarquee()
    expect(jest.mocked(withTiming)).not.toHaveBeenCalled()
    expect(result.current.translateX.value).toBe(0)
  })
})
