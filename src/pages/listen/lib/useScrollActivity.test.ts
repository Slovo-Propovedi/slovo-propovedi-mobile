import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isListenScrollingAtom } from '../model'
import { SCROLL_IDLE_MS, useScrollActivity } from './useScrollActivity'

describe('useScrollActivity', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('marks the screen as scrolling on a scroll event and idles after SCROLL_IDLE_MS', async () => {
    const { ctx, result } = await renderHookWithProviders(() => useScrollActivity())
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    await act(async () => {
      jest.advanceTimersByTime(SCROLL_IDLE_MS)
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(false)
  })

  test('keeps the screen scrolling while events keep arriving', async () => {
    const { ctx, result } = await renderHookWithProviders(() => useScrollActivity())
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    // Events keep arriving before the window closes — each one resets the idle timer.
    jest.advanceTimersByTime(SCROLL_IDLE_MS - 50)
    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    jest.advanceTimersByTime(SCROLL_IDLE_MS - 50)
    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    // The last event is followed by a full idle window: the flag finally drops.
    await act(async () => {
      jest.advanceTimersByTime(SCROLL_IDLE_MS)
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(false)
  })

  test('unmounting mid-scroll resets the flag instead of leaving it stuck', async () => {
    const { ctx, result, unmount } = await renderHookWithProviders(() => useScrollActivity())
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    // The ScrollView is swapped out (e.g. search-activated SermonSearchResults)
    // while the idle timer is still pending — cleanup must reset the flag.
    await unmount()

    expect(ctx.get(isListenScrollingAtom)).toBe(false)
  })

  test('unmounting leaves no timer behind (flag stays idle-stable)', async () => {
    const { ctx, result, unmount } = await renderHookWithProviders(() => useScrollActivity())
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await act(async () => {
      result.current.onScroll()
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(true)

    // Let the idle window close first: RNTL act + fake timers deadlock when
    // unmounting while a fake timer is pending, so unmount runs timer-free.
    await act(async () => {
      jest.advanceTimersByTime(SCROLL_IDLE_MS)
    })
    expect(ctx.get(isListenScrollingAtom)).toBe(false)

    await unmount()

    // After the screen is gone, time passing must never flip the flag back.
    jest.advanceTimersByTime(SCROLL_IDLE_MS)
    expect(ctx.get(isListenScrollingAtom)).toBe(false)
  })
})
