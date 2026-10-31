import { act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks'
import { isPlayingAtom } from '../model'
import { useForegroundPlaybackReconcile } from './useForegroundPlaybackReconcile'

const mockGetStatus = jest.fn()
const mockReconcileOnForeground = jest.fn()

jest.mock('../lib/usePlayer', () => ({
  usePlayer: () => ({
    getStatus: mockGetStatus,
    reconcileOnForeground: mockReconcileOnForeground,
  }),
}))

const NATIVE_PLAYING = { duration: 120_000, isPlaying: true, position: 42_000 }
const NATIVE_PAUSED = { duration: 120_000, isPlaying: false, position: 42_000 }

describe('useForegroundPlaybackReconcile', () => {
  let appStateHandler: (state: AppStateStatus) => void

  beforeEach(() => {
    jest.clearAllMocks()
    AppState.currentState = 'background'
    isPlayingAtom(ctx, false)
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
      appStateHandler = handler as (state: AppStateStatus) => void
      return { remove: jest.fn() }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    isPlayingAtom(ctx, false)
  })

  test('reconciles when the native engine plays after a background resume', async () => {
    mockGetStatus.mockReturnValue(NATIVE_PLAYING)

    await renderHookWithProviders(() => useForegroundPlaybackReconcile())

    await act(async () => {
      appStateHandler('active')
    })

    expect(mockReconcileOnForeground).toHaveBeenCalledTimes(1)
  })

  test('reconciles when only the JS atom believes playback is running', async () => {
    mockGetStatus.mockReturnValue(NATIVE_PAUSED)
    isPlayingAtom(ctx, true)

    await renderHookWithProviders(() => useForegroundPlaybackReconcile())

    await act(async () => {
      appStateHandler('active')
    })

    expect(mockReconcileOnForeground).toHaveBeenCalledTimes(1)
  })

  test('skips reconcile when neither JS nor the native engine plays', async () => {
    mockGetStatus.mockReturnValue(NATIVE_PAUSED)

    await renderHookWithProviders(() => useForegroundPlaybackReconcile())

    await act(async () => {
      appStateHandler('active')
    })

    expect(mockReconcileOnForeground).not.toHaveBeenCalled()
  })
})
