import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { sermonCachingEnabledAtom, setSermonCachingEnabled } from 'entities/offline-cache'
import { renderWithProviders } from 'shared/mocks'
import { COLORS, LightTheme, withAlpha } from 'shared/ui/theme'
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

// Pin the theme to LightTheme so the expected colors are derived from a value the
// test controls (theme.primary), not from a frozen hex literal the component's
// useTheme might disagree with. Everything else in the module stays actual.
jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return {
    ...actual,
    useTheme: () => ({ currentTheme: actual.LightTheme, isLight: true, themeMode: 'light' }),
  }
})

const mockedSetSermonCachingEnabled = setSermonCachingEnabled as jest.MockedFunction<
  typeof setSermonCachingEnabled
>
const mockedCancelDownloadsAndClearCache = jest.mocked(cancelDownloadsAndClearCache)

const SWITCH_LABEL = 'Кеширование проповедей'
const SERMON_CACHING_KEY = 'sermon_caching_enabled'
const ON_TRACK_OPACITY = 0.35
// Derived from the same theme value `useTheme` hands the component above.
const THEMED_PRIMARY = LightTheme.primary
const THEMED_ON_TRACK = withAlpha(THEMED_PRIMARY, ON_TRACK_OPACITY)
const OFF_TRACK = COLORS.disabled

type RenderedSwitch = Awaited<ReturnType<typeof renderWithProviders>>

const renderSwitch = async (enabled: boolean) => {
  const ctx = createCtx()
  sermonCachingEnabledAtom(ctx, enabled)

  const result = await renderWithProviders(<SermonCachingHeaderSwitch />, { ctx })
  // Enable after the async render: RNTL flushes with setImmediate, which faking
  // would deadlock. The component schedules its settle timer only on press.
  jest.useFakeTimers({ doNotFake: ['setImmediate'] })

  return result
}

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
  const ORIGINAL_PLATFORM = Platform.OS

  beforeEach(() => {
    jest.clearAllMocks()
    mockedCancelDownloadsAndClearCache.mockResolvedValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
    Platform.OS = ORIGINAL_PLATFORM
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

  test('on iOS the host switch paints the themed primary via the iOS-only props', async () => {
    const { container } = await renderSwitch(true)

    const iosSwitch = container.queryAll(
      node => typeof node.type === 'string' && node.type === 'RCTSwitch',
    )[0]

    expect(iosSwitch.props.thumbTintColor).toBe(THEMED_PRIMARY)
    expect(iosSwitch.props.onTintColor).toBe(THEMED_ON_TRACK)
    expect(iosSwitch.props.tintColor).toBe(OFF_TRACK)
  })

  test('on Android the host switch carries the themed primary despite the iOS-only props', async () => {
    // RN drops the iOS-only props on Android; without `thumbColor`/`trackColor`
    // the host would fall back to the platform-default green. The JS Switch maps
    // `thumbColor` -> native `thumbTintColor` and `trackColor` ->
    // `trackColorForTrue`/`trackColorForFalse`, which is what the host asserts.
    Platform.OS = 'android'

    const { container } = await renderSwitch(true)

    const androidSwitch = container.queryAll(
      node => typeof node.type === 'string' && node.type === 'AndroidSwitch',
    )[0]

    expect(androidSwitch.props.thumbTintColor).toBe(THEMED_PRIMARY)
    expect(androidSwitch.props.trackColorForTrue).toBe(THEMED_ON_TRACK)
    expect(androidSwitch.props.trackColorForFalse).toBe(OFF_TRACK)
  })
})
