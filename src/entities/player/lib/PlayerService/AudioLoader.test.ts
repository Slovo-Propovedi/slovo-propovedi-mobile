import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { reportError } from 'shared/model/error-dialog'
import { audioLoader } from './AudioLoader'

const AUDIO_URL = 'https://example.com/audio.mp3'
const SECOND_AUDIO_URL = 'https://example.com/audio2.mp3'
const LOAD_TICK_MS = 100

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
}))

const mockGetCachedUri = jest.fn<Promise<null | string>, [string]>()

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: {
    getCachedUri: (url: string) => mockGetCachedUri(url),
  },
}))

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: {} }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedReportError = jest.mocked(reportError)

jest.mock('../../model', () => ({
  setDurationAction: jest.fn(),
  setIsBufferingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))

jest.mock('./BackgroundCachingService', () => ({ startBackgroundCaching: jest.fn() }))

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
}))

const mockedCreateAudioPlayer = jest.mocked(createAudioPlayer)
const mockedSetItem = jest.mocked(AsyncStorage.setItem)

const createPlayerStub = (isLoaded = true) => {
  const release = jest.fn()
  const remove = jest.fn()
  const replace = jest.fn()
  const seekTo = jest.fn(() => Promise.resolve())
  const player = {
    duration: 120,
    isLoaded,
    release,
    remove,
    replace,
    seekTo,
  } as unknown as AudioPlayer

  return { player, release, remove, replace, seekTo }
}

const flushLoad = (loadPromise: Promise<AudioPlayer | null>) =>
  jest.advanceTimersByTimeAsync(LOAD_TICK_MS).then(() => loadPromise)

describe('AudioLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetCachedUri.mockResolvedValue(null)
    mockedCreateAudioPlayer.mockImplementation(() => createPlayerStub().player)
  })

  afterEach(() => {
    audioLoader.releaseAndReset()
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('loadAudio', () => {
    test('releases the previous player via release(), never remove()', async () => {
      const { player: previousPlayer, release, remove } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(previousPlayer)

      await flushLoad(audioLoader.loadAudio(AUDIO_URL))
      await flushLoad(audioLoader.loadAudio(SECOND_AUDIO_URL))

      expect(release).toHaveBeenCalledTimes(1)
      expect(remove).not.toHaveBeenCalled()
    })

    test('passes keepAudioSessionActive to prevent iOS session deactivation at track end', async () => {
      await flushLoad(audioLoader.loadAudio(AUDIO_URL))

      expect(mockedCreateAudioPlayer).toHaveBeenCalledWith(
        { uri: AUDIO_URL },
        { downloadFirst: false, keepAudioSessionActive: true },
      )
    })

    test('returns null for an empty url without touching the native side', async () => {
      const result = await audioLoader.loadAudio('')

      expect(result).toBeNull()
      expect(mockedCreateAudioPlayer).not.toHaveBeenCalled()
    })

    test('persists the loaded duration', async () => {
      await flushLoad(audioLoader.loadAudio(AUDIO_URL))

      expect(mockedSetItem).toHaveBeenCalledWith('currentSoundDuration', '120000')
    })
  })

  describe('replaceAudio', () => {
    test('replaces the source in place without recreating or releasing the player', async () => {
      const { player: existingPlayer, release, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await flushLoad(audioLoader.loadAudio(AUDIO_URL))
      const result = await flushLoad(audioLoader.replaceAudio(SECOND_AUDIO_URL))

      expect(replace).toHaveBeenCalledWith(SECOND_AUDIO_URL)
      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
      expect(release).not.toHaveBeenCalled()
      expect(result).toBe(existingPlayer)
    })

    test('falls back to loadAudio when no player instance exists yet', async () => {
      const result = await flushLoad(audioLoader.replaceAudio(AUDIO_URL))

      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
      expect(result).not.toBeNull()
    })

    test('returns null when replace throws and does not recreate the player', async () => {
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await flushLoad(audioLoader.loadAudio(AUDIO_URL))
      replace.mockImplementation(() => {
        throw new Error('native replace failed')
      })

      const result = await flushLoad(audioLoader.replaceAudio(SECOND_AUDIO_URL))

      expect(result).toBeNull()
      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
    })

    test('reports a replace failure through reportError', async () => {
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await flushLoad(audioLoader.loadAudio(AUDIO_URL))
      replace.mockImplementation(() => {
        throw new Error('native replace failed')
      })

      await flushLoad(audioLoader.replaceAudio(SECOND_AUDIO_URL))

      expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), 'Ошибка при замене аудио')
    })

    test('routes a cached file:// uri into replace() unchanged', async () => {
      const cachedUri = 'file:///data/cache/audio2.mp3'
      mockGetCachedUri.mockResolvedValue(cachedUri)
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await flushLoad(audioLoader.loadAudio(AUDIO_URL))
      await flushLoad(audioLoader.replaceAudio(SECOND_AUDIO_URL))

      expect(replace).toHaveBeenCalledWith(cachedUri)
    })

    test('catches a rejected initial seekTo instead of leaking an unhandled rejection', async () => {
      const { player, seekTo } = createPlayerStub()
      seekTo.mockRejectedValue(new Error('seek failed'))
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await expect(flushLoad(audioLoader.loadAudio(AUDIO_URL))).resolves.not.toBeNull()
    })
  })
})
