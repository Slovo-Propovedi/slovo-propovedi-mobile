import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { sermonCachingEnabledAtom, setSermonCachingEnabled } from 'entities/offline-cache'
import { renderWithProviders } from 'shared/mocks'
import type * as OfflineCache from 'entities/offline-cache'
import { cancelDownloadsAndClearCache } from '../lib/cancelDownloadsAndClearCache'
import { SermonCachingHeaderSwitch, TOGGLE_SETTLE_MS } from './SermonCachingHeaderSwitch'

jest.mock('entities/offline-cache', () => {
  const actual = jest.requireActual<typeof OfflineCache>('entities/offline-cache')

  return {
    ...actual,
    // Wrapping the real action keeps the optimistic atom flip and the persist,
    // while recording the pressed target for assertions.
    setSermonCachingEnabled: jest.fn(actual.setSermonCachingEnabled),
  }
})

jest.mock('../lib/cancelDownloadsAndClearCache', () => ({
  cancelDownloadsAndClearCache: jest.fn().mockResolvedValue(true),
}))

const mockedSetSermonCachingEnabled = setSermonCachingEnabled as jest.MockedFunction<
  typeof setSermonCachingEnabled
>
const mockedCancelDownloadsAndClearCache = jest.mocked(cancelDownloadsAndClearCache)

const SWITCH_LABEL = 'Кеширование проповедей'
const SERMON_CACHING_KEY = 'sermon_caching_enabled'

const renderSwitch = async (enabled: boolean) => {
  const ctx = createCtx()
  sermonCachingEnabledAtom(ctx, enabled)

  const result = await renderWithProviders(<SermonCachingHeaderSwitch />, { ctx })
  // Enable after the async render: RNTL flushes with setImmediate, which faking
  // would deadlock. The component schedules its settle timer only on press.
  jest.useFakeTimers({ doNotFake: ['setImmediate'] })

  return result
}

type RenderedSwitch = Awaited<ReturnType<typeof renderWithProviders>>

// The pressable wrapper is the only control: the inner Switch ignores touches.
const pressSwitch = async (getByRole: RenderedSwitch['getByRole']) => {
  await act(async () => {
    fireEvent(getByRole('switch', { name: SWITCH_LABEL }), 'press')
  })
}

const advanceSettle = async (ms: number = TOGGLE_SETTLE_MS) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

describe('<SermonCachingHeaderSwitch>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedCancelDownloadsAndClearCache.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('reflects the persisted setting in the header switch', async () => {
    const { getByRole } = await renderSwitch(true)

    expect(getByRole('switch', { name: SWITCH_LABEL })).toBeChecked()
  })

  test('turning caching on only persists the setting', async () => {
    const { ctx, getByRole } = await renderSwitch(false)

    await pressSwitch(getByRole)
    await advanceSettle()

    expect(mockedSetSermonCachingEnabled).toHaveBeenLastCalledWith(expect.anything(), true)
    expect(ctx.get(sermonCachingEnabledAtom)).toBe(true)
    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()
  })

  test('turning caching off flips instantly and clears the cache once, after settling', async () => {
    const { ctx, getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole)

    // The visual flip is immediate; the destructive clear is not.
    expect(ctx.get(sermonCachingEnabledAtom)).toBe(false)
    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()

    await advanceSettle()

    expect(mockedCancelDownloadsAndClearCache).toHaveBeenCalledTimes(1)
    expect(mockedCancelDownloadsAndClearCache).toHaveBeenCalledWith(ctx)
  })

  test('the clear waits for the full settle window', async () => {
    const { getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole)

    await advanceSettle(TOGGLE_SETTLE_MS / 2)
    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()

    await advanceSettle(TOGGLE_SETTLE_MS / 2)
    expect(mockedCancelDownloadsAndClearCache).toHaveBeenCalledTimes(1)
  })

  test('a rapid double press that ends ON never clears the cache', async () => {
    const { ctx, getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole) // ON -> OFF schedules the clear
    await pressSwitch(getByRole) // OFF -> ON cancels it

    expect(ctx.get(sermonCachingEnabledAtom)).toBe(true)
    expect(mockedSetSermonCachingEnabled).toHaveBeenLastCalledWith(expect.anything(), true)

    await advanceSettle()

    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()
  })

  test('flipping back ON before the timer elapses cancels the pending clear', async () => {
    const { getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole) // ON -> OFF

    await advanceSettle(TOGGLE_SETTLE_MS / 2)
    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()

    await pressSwitch(getByRole) // OFF -> ON before the window elapses

    await advanceSettle()

    expect(mockedCancelDownloadsAndClearCache).not.toHaveBeenCalled()
  })

  test('rapid presses ending OFF clear the cache exactly once', async () => {
    const { ctx, getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole) // ON -> OFF
    await pressSwitch(getByRole) // OFF -> ON
    await pressSwitch(getByRole) // ON -> OFF

    expect(ctx.get(sermonCachingEnabledAtom)).toBe(false)
    expect(mockedSetSermonCachingEnabled).toHaveBeenLastCalledWith(expect.anything(), false)

    await advanceSettle()

    expect(mockedCancelDownloadsAndClearCache).toHaveBeenCalledTimes(1)
  })

  test('persists the OFF value before the clear runs', async () => {
    const { getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole)
    await advanceSettle()

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(SERMON_CACHING_KEY, 'false')
    const [lastPersistAt] = jest.mocked(AsyncStorage.setItem).mock.invocationCallOrder.slice(-1)
    const [clearAt] = mockedCancelDownloadsAndClearCache.mock.invocationCallOrder
    expect(lastPersistAt).toBeLessThan(clearAt)
  })

  test('a rejected clear is logged', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockedCancelDownloadsAndClearCache.mockRejectedValue(new Error('clear failed'))
    const { getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole)
    await advanceSettle()

    expect(console.error).toHaveBeenCalledWith(
      '[offline] Failed to clear the audio cache:',
      expect.any(Error),
    )
  })

  test('a rejected persist is logged', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockedSetSermonCachingEnabled.mockImplementationOnce(() =>
      Promise.reject(new Error('persist failed')),
    )
    const { getByRole } = await renderSwitch(true)

    await pressSwitch(getByRole)
    await advanceSettle()

    expect(console.error).toHaveBeenCalledWith(
      '[offline] Failed to apply the sermon caching setting:',
      expect.any(Error),
    )
  })

  test('the informed switch paints a primary thumb over a dimmed primary track', async () => {
    const { container } = await renderSwitch(true)

    const switchNode = container.queryAll(node => node.props.thumbTintColor !== undefined)[0]

    expect(switchNode.props.thumbTintColor).toBe('#f16031')
    expect(switchNode.props.onTintColor).toBe('rgba(241, 96, 49, 0.35)')
    expect(switchNode.props.tintColor).toBe('#d3d3d3')
  })
})
