import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from '../mocks'
import { isScreenTransitioningAtom } from '../model/screenTransition'
import { useScreenTransitionTracking } from './useScreenTransitionTracking'

const mockUnsubscribe = jest.fn()
const mockAddListener = jest.fn((_event: string, _listener: () => void) => mockUnsubscribe)

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: mockAddListener }),
}))

describe('useScreenTransitionTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('subscribes on mount without starting a transition', async () => {
    const ctx = createCtx()

    await renderHookWithProviders(() => useScreenTransitionTracking(), { ctx })

    expect(mockAddListener).toHaveBeenCalledWith('transitionEnd', expect.any(Function))
    expect(ctx.get(isScreenTransitioningAtom)).toBe(false)
  })

  test('clears the optimistic transition flag when the transition ends', async () => {
    const ctx = createCtx()
    isScreenTransitioningAtom(ctx, true)

    await renderHookWithProviders(() => useScreenTransitionTracking(), { ctx })

    const listener = mockAddListener.mock.calls[0][1]
    await act(async () => {
      listener()
    })

    expect(ctx.get(isScreenTransitioningAtom)).toBe(false)
  })

  test('removes the listener and clears a stuck flag on unmount', async () => {
    const ctx = createCtx()
    isScreenTransitioningAtom(ctx, true)
    const { unmount } = await renderHookWithProviders(() => useScreenTransitionTracking(), {
      ctx,
    })

    await act(async () => {
      unmount()
    })

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
    expect(ctx.get(isScreenTransitioningAtom)).toBe(false)
  })
})
