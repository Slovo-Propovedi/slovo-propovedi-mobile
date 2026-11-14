import { act, renderHook } from '@testing-library/react-native'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { MINI_TUCK_FADE_MS } from './miniPillFade'
import { useMiniPlayerMount } from './useMiniPlayerMount'

// The slide lands first, the delayed fade lands MINI_TUCK_FADE_MS later.
const TUCK_TEARDOWN_MS = BAR_MORPH_DURATION_MS + MINI_TUCK_FADE_MS

const renderMount = async (isHidden: boolean) =>
  renderHook(({ hidden }: { hidden: boolean }) => useMiniPlayerMount(hidden), {
    initialProps: { hidden: isHidden },
  })

describe('useMiniPlayerMount', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('keeps the pill through the tuck window, then unmounts it', async () => {
    const { rerender, result } = await renderMount(false)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await rerender({ hidden: true })
    await act(async () => {
      jest.advanceTimersByTime(TUCK_TEARDOWN_MS - 1)
    })

    expect(result.current).toBe(true)

    await act(async () => {
      jest.advanceTimersByTime(1)
    })

    expect(result.current).toBe(false)
  })

  test('cancels the pending teardown when the pill is shown again', async () => {
    const { rerender, result } = await renderMount(false)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await rerender({ hidden: true })
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    await rerender({ hidden: false })
    await act(async () => {
      jest.advanceTimersByTime(TUCK_TEARDOWN_MS * 2)
    })

    expect(result.current).toBe(true)
  })

  test('restarts the full window on the next hide', async () => {
    const { rerender, result } = await renderMount(false)
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })

    await rerender({ hidden: true })
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    await rerender({ hidden: false })
    await act(async () => {
      jest.advanceTimersByTime(50)
    })
    await rerender({ hidden: true })
    await act(async () => {
      jest.advanceTimersByTime(400)
    })

    // The first hide's timer must not carry over into the second hide.
    expect(result.current).toBe(true)

    await act(async () => {
      jest.advanceTimersByTime(TUCK_TEARDOWN_MS - 400)
    })

    expect(result.current).toBe(false)
  })
})
