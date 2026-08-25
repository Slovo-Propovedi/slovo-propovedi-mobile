import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { reportError } from 'shared/model/error-dialog'
import { setDurationAction, setIsBufferingAction, setPositionAction } from '../../model'
import { audioLoader } from './AudioLoader'

const AUDIO_URL = 'https://example.com/audio.mp3'
const SECOND_AUDIO_URL = 'https://example.com/audio2.mp3'

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
const mockedSetDurationAction = jest.mocked(setDurationAction)
const mockedSetIsBufferingAction = jest.mocked(setIsBufferingAction)
const mockedSetPositionAction = jest.mocked(setPositionAction)

type ListenerCallback = (status: { error?: string; isLoaded: boolean }) => void

const createPlayerStub = (
  overrides: {
    currentTime?: number
    duration?: number
    isLoaded?: boolean
  } = {},
) => {
  const { currentTime = 0, duration = 120, isLoaded = true } = overrides
  const release = jest.fn()
  const remove = jest.fn()
  const replace = jest.fn()
  const seekTo = jest.fn(() => Promise.resolve())
  let listenerCallback: ListenerCallback | null = null

  const addListener = jest.fn((_event: string, cb: ListenerCallback) => {
    listenerCallback = cb
    return { remove: jest.fn() }
  })

  const player = {
    addListener,
    currentTime,
    duration,
    isLoaded,
    release,
    remove,
    replace,
    seekTo,
  } as unknown as AudioPlayer

  const fireStatus = (status: { error?: string; isLoaded: boolean }) => {
    listenerCallback?.(status)
  }

  return { addListener, fireStatus, player, release, remove, replace, seekTo }
}

describe('AudioLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetCachedUri.mockResolvedValue(null)
    mockedCreateAudioPlayer.mockImplementation(() => createPlayerStub().player)
  })

  afterEach(() => {
    audioLoader.releaseAndReset()
    jest.restoreAllMocks()
  })

  describe('loadAudio', () => {
    test('releases the previous player via release(), never remove()', async () => {
      const { player: previousPlayer, release, remove } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(previousPlayer)

      await audioLoader.loadAudio(AUDIO_URL)
      await audioLoader.loadAudio(SECOND_AUDIO_URL)

      expect(release).toHaveBeenCalledTimes(1)
      expect(remove).not.toHaveBeenCalled()
    })

    test('passes keepAudioSessionActive to prevent iOS session deactivation at track end', async () => {
      await audioLoader.loadAudio(AUDIO_URL)

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
      await audioLoader.loadAudio(AUDIO_URL)

      expect(mockedSetItem).toHaveBeenCalledWith('currentSoundDuration', '120000')
    })
  })

  describe('replaceAudio', () => {
    test('replaces the source in place without recreating or releasing the player', async () => {
      const { player: existingPlayer, release, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await audioLoader.loadAudio(AUDIO_URL)
      const result = await audioLoader.replaceAudio(SECOND_AUDIO_URL)

      expect(replace).toHaveBeenCalledWith(SECOND_AUDIO_URL)
      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
      expect(release).not.toHaveBeenCalled()
      expect(result).toBe(existingPlayer)
    })

    test('falls back to loadAudio when no player instance exists yet', async () => {
      const result = await audioLoader.replaceAudio(AUDIO_URL)

      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
      expect(result).not.toBeNull()
    })

    test('returns null when replace throws and does not recreate the player', async () => {
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await audioLoader.loadAudio(AUDIO_URL)
      replace.mockImplementation(() => {
        throw new Error('native replace failed')
      })

      const result = await audioLoader.replaceAudio(SECOND_AUDIO_URL)

      expect(result).toBeNull()
      expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1)
    })

    test('reports a replace failure through reportError', async () => {
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await audioLoader.loadAudio(AUDIO_URL)
      replace.mockImplementation(() => {
        throw new Error('native replace failed')
      })

      await audioLoader.replaceAudio(SECOND_AUDIO_URL)

      expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), 'Ошибка при замене аудио')
    })

    test('routes a cached file:// uri into replace() unchanged', async () => {
      const cachedUri = 'file:///data/cache/audio2.mp3'
      mockGetCachedUri.mockResolvedValue(cachedUri)
      const { player: existingPlayer, replace } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(existingPlayer)

      await audioLoader.loadAudio(AUDIO_URL)
      await audioLoader.replaceAudio(SECOND_AUDIO_URL)

      expect(replace).toHaveBeenCalledWith(cachedUri)
    })

    test('catches a rejected initial seekTo instead of leaking an unhandled rejection', async () => {
      // Use initialPositionMs > 0 so seekTo is actually invoked; fresh position → seek is attempted
      const { player, seekTo } = createPlayerStub({ currentTime: 0 })
      seekTo.mockRejectedValue(new Error('seek failed'))
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await expect(audioLoader.loadAudio(AUDIO_URL, 3000)).resolves.toBe(player)
    })
  })

  describe('waitForLoaded seek guards', () => {
    test('does NOT call seekTo when initialPositionMs is 0', async () => {
      const { player, seekTo } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await audioLoader.loadAudio(AUDIO_URL, 0)

      expect(seekTo).not.toHaveBeenCalled()
    })

    test('does NOT call seekTo when currentTime has advanced past initialPositionMs + tolerance (stale)', async () => {
      // Production reads player.currentTime in SECONDS (×1000).
      // initialPositionMs=3000, currentTime=8.5s → 8500 > 4500 (3000+1500) → stale
      const { player, seekTo } = createPlayerStub({ currentTime: 8.5 })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await audioLoader.loadAudio(AUDIO_URL, 3000)

      expect(seekTo).not.toHaveBeenCalled()
    })

    test('applies seekTo when initialPositionMs > 0 and position is still fresh', async () => {
      // initialPositionMs=3000, currentTime=2.0s → 2000 <= 4500 → fresh, seek applied
      const { player, seekTo } = createPlayerStub({ currentTime: 2.0 })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await audioLoader.loadAudio(AUDIO_URL, 3000)

      expect(seekTo).toHaveBeenCalledWith(3)
    })

    test('resolves via playbackStatusUpdate event when player is not yet loaded', async () => {
      jest.useFakeTimers()
      const { fireStatus, player } = createPlayerStub({ isLoaded: false })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      const loadPromise = audioLoader.loadAudio(AUDIO_URL)
      // Flush microtasks so loadAudio reaches waitForLoaded subscription
      await jest.advanceTimersByTimeAsync(0)

      // Simulate native event arriving (works in background where timers freeze)
      fireStatus({ isLoaded: true })

      const result = await loadPromise
      expect(result).toBe(player)
      jest.useRealTimers()
    })

    test('does NOT resolve on an isLoaded=false event, resolves on subsequent isLoaded=true', async () => {
      // Native always emits at least one isLoaded=false status first — one-shot semantics must not
      // treat it as a completion signal.
      jest.useFakeTimers()
      const { fireStatus, player } = createPlayerStub({ isLoaded: false })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      const loadPromise = audioLoader.loadAudio(AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)

      // First event: still loading — must NOT resolve
      fireStatus({ isLoaded: false })

      // The 30s timeout is still ticking; advance just 10ms to flush microtasks
      // — the promise must still be pending (30s ≫ 10ms)
      const raceResult = await Promise.race([
        loadPromise.then(() => 'resolved' as const),
        jest.advanceTimersByTimeAsync(10).then(() => 'pending' as const),
      ])
      expect(raceResult).toBe('pending')

      // Second event: loaded — now resolves
      fireStatus({ isLoaded: true })
      const result = await loadPromise
      expect(result).toBe(player)
      jest.useRealTimers()
    })

    test('resolves null and clears isBuffering after timeout fallback', async () => {
      jest.useFakeTimers()
      const { addListener, player } = createPlayerStub({ isLoaded: false })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      const loadPromise = audioLoader.loadAudio(AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)

      // Advance past the 30s timeout
      await jest.advanceTimersByTimeAsync(30_000)

      const result = await loadPromise
      expect(result).toBeNull()

      // isBuffering cleared (setIsBuffering false)
      expect(mockedSetIsBufferingAction).toHaveBeenCalledWith({}, false)

      // Subscription removed
      const subscription = addListener.mock.results[0].value
      expect(subscription.remove).toHaveBeenCalled()

      jest.useRealTimers()
    })

    test('superseded wait performs no setIsBuffering/duration writes and no seek', async () => {
      // Regression: when a newer loadAudio supersedes a pending one, the stale wait must not
      // write GLOBAL state (duration, buffering, position) or call seekTo.
      jest.useFakeTimers()
      const {
        fireStatus,
        player: stalePlayer,
        seekTo: staleSeekTo,
      } = createPlayerStub({
        isLoaded: false,
      })
      mockedCreateAudioPlayer.mockReturnValueOnce(stalePlayer)

      // Start first load (will become stale)
      const stalePromise = audioLoader.loadAudio(AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)

      // Second load supersedes the first (sets a new playerInstance)
      const { player: freshPlayer } = createPlayerStub({ currentTime: 0 })
      mockedCreateAudioPlayer.mockReturnValueOnce(freshPlayer)
      const freshPromise = audioLoader.loadAudio(SECOND_AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)

      // Clear mocks so we only capture stale-path effects
      mockedSetIsBufferingAction.mockClear()
      mockedSetDurationAction.mockClear()
      mockedSetPositionAction.mockClear()
      staleSeekTo.mockClear()

      // Complete the stale wait via event — should be a no-op
      fireStatus({ isLoaded: true })

      // The fresh load is still pending (sync fast-path, already loaded)
      const staleResult = await stalePromise
      const freshResult = await freshPromise

      expect(staleResult).toBe(stalePlayer)
      expect(freshResult).toBe(freshPlayer)

      // No global state writes from the stale completion
      expect(mockedSetIsBufferingAction).not.toHaveBeenCalled()
      expect(mockedSetDurationAction).not.toHaveBeenCalled()
      expect(mockedSetPositionAction).not.toHaveBeenCalled()
      expect(staleSeekTo).not.toHaveBeenCalled()

      jest.useRealTimers()
    })

    test('removes the event subscription after completion (no leak)', async () => {
      const { addListener, player } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await audioLoader.loadAudio(AUDIO_URL)

      // Sync path: addListener is never called — no subscription to remove
      expect(addListener).not.toHaveBeenCalled()
    })

    test('removes event subscription after event-driven completion (no leak)', async () => {
      jest.useFakeTimers()
      const { addListener, fireStatus, player } = createPlayerStub({ isLoaded: false })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      const loadPromise = audioLoader.loadAudio(AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)
      fireStatus({ isLoaded: true })

      const result = await loadPromise
      expect(result).toBe(player)

      // The subscription mock's remove() should have been called
      const subscription = addListener.mock.results[0].value
      expect(subscription.remove).toHaveBeenCalled()
      jest.useRealTimers()
    })

    test('clears isBufferingAction after loading', async () => {
      const { player } = createPlayerStub()
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      await audioLoader.loadAudio(AUDIO_URL)

      // setIsBufferingAction is called with (ctx, true) at start and (ctx, false) after load
      expect(mockedSetIsBufferingAction).toHaveBeenCalledWith({}, false)
    })

    test('resolves null on error status without hanging 30s', async () => {
      jest.useFakeTimers()
      const { addListener, fireStatus, player } = createPlayerStub({ isLoaded: false })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      const loadPromise = audioLoader.loadAudio(AUDIO_URL)
      await jest.advanceTimersByTimeAsync(0)

      // Fire error status — must resolve immediately, not wait for timeout
      fireStatus({ error: 'Failed to load', isLoaded: false })

      const result = await loadPromise
      expect(result).toBeNull()

      // isBuffering cleared
      expect(mockedSetIsBufferingAction).toHaveBeenCalledWith({}, false)

      // Subscription removed (no leak)
      const subscription = addListener.mock.results[0].value
      expect(subscription.remove).toHaveBeenCalled()

      jest.useRealTimers()
    })

    test('clamps seekTo to loaded duration when initialPositionMs exceeds duration', async () => {
      const { player, seekTo } = createPlayerStub({ currentTime: 0, duration: 10 })
      mockedCreateAudioPlayer.mockReturnValueOnce(player)

      // initialPositionMs=15000 but duration=10s (10000ms) → should clamp to 10000ms → seekTo(10)
      await audioLoader.loadAudio(AUDIO_URL, 15000)

      expect(seekTo).toHaveBeenCalledWith(10)
    })
  })
})
