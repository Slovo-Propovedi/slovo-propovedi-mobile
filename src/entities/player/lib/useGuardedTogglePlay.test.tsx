import { act } from '@testing-library/react-native'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, isPlayingAtom } from '../model'
import { useGuardedTogglePlay } from './useGuardedTogglePlay'

const mockPause = jest.fn().mockResolvedValue(undefined)
const mockPlay = jest.fn().mockResolvedValue(undefined)

jest.mock('./usePlayer', () => ({
  usePlayer: () => ({ pause: mockPause, play: mockPlay }),
}))

jest.mock('./playOfflineGuard', () => ({
  guardOfflinePlayback: jest.fn(),
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Test Sermon',
}

describe('useGuardedTogglePlay', () => {
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let guardOfflinePlayback: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockPause.mockResolvedValue(undefined)
    mockPlay.mockResolvedValue(undefined)
    currentAudioAtom(ctx, null)
    isPlayingAtom(ctx, false)
    isOnlineAtom(ctx, true)
    guardOfflinePlayback = jest.mocked(jest.requireMock('./playOfflineGuard').guardOfflinePlayback)
    guardOfflinePlayback.mockResolvedValue(false)
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  test('offline + uncached + paused → guard blocks, play() NOT called', async () => {
    currentAudioAtom(ctx, mockAudio)
    isOnlineAtom(ctx, false)
    guardOfflinePlayback.mockResolvedValue(true)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(guardOfflinePlayback).toHaveBeenCalledWith(AUDIO_URL, false)
    expect(mockPlay).not.toHaveBeenCalled()
    expect(mockPause).not.toHaveBeenCalled()
  })

  test('offline + cached → play() called', async () => {
    currentAudioAtom(ctx, mockAudio)
    isOnlineAtom(ctx, false)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(guardOfflinePlayback).toHaveBeenCalledWith(AUDIO_URL, false)
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  test('online + uncached → play() called', async () => {
    currentAudioAtom(ctx, mockAudio)
    isOnlineAtom(ctx, true)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(guardOfflinePlayback).toHaveBeenCalledWith(AUDIO_URL, true)
    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  test('playing → pause() called, guard NOT called, no dialog', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    isOnlineAtom(ctx, false)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(mockPause).toHaveBeenCalledTimes(1)
    expect(guardOfflinePlayback).not.toHaveBeenCalled()
    expect(reportError).not.toHaveBeenCalled()
  })

  test('no currentAudio → no-op', async () => {
    isOnlineAtom(ctx, false)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(guardOfflinePlayback).not.toHaveBeenCalled()
    expect(mockPlay).not.toHaveBeenCalled()
    expect(mockPause).not.toHaveBeenCalled()
  })

  test('audioUrl empty string → no-op', async () => {
    currentAudioAtom(ctx, { ...mockAudio, audioUrl: '' })
    isOnlineAtom(ctx, false)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(guardOfflinePlayback).not.toHaveBeenCalled()
    expect(mockPlay).not.toHaveBeenCalled()
  })

  test('play() rejects with AppState error → console.warn, reportError NOT called, swallowed', async () => {
    currentAudioAtom(ctx, mockAudio)
    isOnlineAtom(ctx, true)
    const appStateError = new Error('play() failed because activity is no longer available')
    mockPlay.mockRejectedValue(appStateError)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Player] Ignoring AppState-related error:',
      appStateError.message,
    )
    expect(reportError).not.toHaveBeenCalled()
  })

  test('pause() rejects with AppState error → console.warn, reportError NOT called, swallowed', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    const appStateError = new Error('pause() failed because activity is no longer available')
    mockPause.mockRejectedValue(appStateError)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await result.current.togglePlay()
    })

    expect(mockPause).toHaveBeenCalledTimes(1)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Player] Ignoring AppState-related error:',
      appStateError.message,
    )
    expect(reportError).not.toHaveBeenCalled()
  })

  test('play() rejects with other error → reportError called and rejection rethrown', async () => {
    currentAudioAtom(ctx, mockAudio)
    isOnlineAtom(ctx, true)
    const genericError = new Error('boom')
    mockPlay.mockRejectedValue(genericError)

    const { result } = await renderHookWithProviders(() => useGuardedTogglePlay(), { ctx })

    await act(async () => {
      await expect(result.current.togglePlay()).rejects.toThrow('boom')
    })

    expect(reportError).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledWith(
      genericError,
      'Ошибка при переключении воспроизведения',
    )
  })
})
