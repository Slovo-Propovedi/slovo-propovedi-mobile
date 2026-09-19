import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  durationAtom,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
} from '../../../model'
import { isStalledOfflineAtom, setIsStalledOfflineAction } from '../../stalledOffline'
import { startBackgroundCaching } from '../BackgroundCachingService'
import { playerService } from '../index.web'
import { flushProgress, scheduleHistoryFlush } from '../progressFlusher'
import { audioStubs, removeGlobalAudioStub, setupWebPlayerTest } from './testHelpers'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/model/network', () => ({ isOnlineAtom: jest.fn() }))

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
}))

jest.mock('../BackgroundCachingService', () => ({
  startBackgroundCaching: jest.fn(),
}))

jest.mock('../../../model', () => ({
  currentAudioAtom: jest.fn(),
  durationAtom: jest.fn(),
  setDurationAction: jest.fn(),
  setIsBufferingAction: jest.fn(),
  setIsPlayingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))

jest.mock('../../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

jest.mock('../../stalledOffline', () => ({
  isStalledOfflineAtom: jest.fn(),
  setIsStalledOfflineAction: jest.fn(),
}))

jest.mock('../progressFlusher', () => ({
  flushProgress: jest.fn(),
  scheduleHistoryFlush: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'
const LOADED_METADATA_EVENT = 'loadedmetadata'
const PAUSE_EVENT = 'pause'
const PLAY_EVENT = 'play'
const AUDIO_EVENT_TYPES = [
  'loadedmetadata',
  'durationchange',
  'play',
  'pause',
  'timeupdate',
  'ended',
  'error',
  'waiting',
  'playing',
] as const

const mockSermonContext = () => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return { id: 'sermon-1' }
    if (atom === durationAtom) return 100000
    return undefined
  })
}

const mockOnlineStatus = (online: boolean) => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === isOnlineAtom) return online
    return undefined
  })
}

const mockStalledOffline = (stalled: boolean) => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === isStalledOfflineAtom) return stalled
    return undefined
  })
}

const flushAutoCache = () =>
  new Promise<void>(resolve => {
    setImmediate(resolve)
  })

beforeEach(async () => {
  jest.mocked(audioCacheService.isCached).mockResolvedValue(false)
  await setupWebPlayerTest(playerService)
  ;(ctx.get as jest.Mock).mockReset()
})

afterEach(() => {
  jest.restoreAllMocks()
  removeGlobalAudioStub()
})

describe('WebPlayerService pause flush', () => {
  test('pause event from a replaced element does not flush progress', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    await playerService.loadAudio(AUDIO_URL)

    audioStubs[0].fireEvent(PAUSE_EVENT)

    expect(flushProgress).not.toHaveBeenCalled()
    AUDIO_EVENT_TYPES.forEach(type => {
      expect(audioStubs[0].element.removeEventListener).toHaveBeenCalledWith(
        type,
        expect.any(Function),
      )
    })
  })

  test('pause event while state says not playing does not flush', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)

    audioStubs[0].fireEvent(PAUSE_EVENT)

    expect(flushProgress).not.toHaveBeenCalled()
  })

  test('external pause event while playing flushes with the element currentTime', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42
    audioStubs[0].fireEvent(PLAY_EVENT)

    audioStubs[0].fireEvent(PAUSE_EVENT)

    expect(flushProgress).toHaveBeenCalledWith(42000)
  })
})

describe('WebPlayerService stop and unload flush', () => {
  test('stop() flushes the pre-stop position before pause/reset', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42

    await playerService.stop()

    expect(flushProgress).toHaveBeenCalledWith(42000)
    expect(audioStubs[0].pause).toHaveBeenCalled()
    expect(audioStubs[0].element.currentTime).toBe(0)
  })

  test('unload() flushes the position before tearing down', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 12

    await playerService.unload()

    expect(flushProgress).toHaveBeenCalledWith(12000)
    expect(audioStubs[0].pause).toHaveBeenCalled()
  })
})

describe('WebPlayerService seekTo', () => {
  test('clamps negative positions to 0 and schedules a history flush', async () => {
    await playerService.loadAudio(AUDIO_URL)

    await playerService.seekTo(-5000)

    expect(audioStubs[0].element.currentTime).toBe(0)
    expect(scheduleHistoryFlush).toHaveBeenCalledWith(0)
  })

  test('applies positive positions and schedules a history flush', async () => {
    await playerService.loadAudio(AUDIO_URL)

    await playerService.seekTo(60000)

    expect(audioStubs[0].element.currentTime).toBe(60)
    expect(scheduleHistoryFlush).toHaveBeenCalledWith(60000)
  })
})

describe('WebPlayerService flushProgressAtCurrentTime guards', () => {
  test('no-ops without an audio instance', async () => {
    mockSermonContext()

    await playerService.pause()

    expect(flushProgress).not.toHaveBeenCalled()
  })

  test('delegates the current position to flushProgress (sermon guard lives downstream)', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42

    await playerService.pause()

    expect(flushProgress).toHaveBeenCalledWith(42000)
  })
})

describe('WebPlayerService duration bridge', () => {
  test('loadedmetadata writes the element duration into the shared duration atom', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.duration = 123.456

    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)

    expect(setDurationAction).toHaveBeenCalledWith(expect.anything(), 123456)
  })

  test('durationchange also writes the duration into the shared atom', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.duration = 90

    audioStubs[0].fireEvent('durationchange')

    expect(setDurationAction).toHaveBeenCalledWith(expect.anything(), 90000)
  })

  test('invalid duration is not written into the shared atom', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.duration = NaN

    const mockedSetDuration = jest.mocked(setDurationAction)
    mockedSetDuration.mockClear()

    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)

    expect(mockedSetDuration).not.toHaveBeenCalled()
  })

  test('replaceAudio resets the duration atom to 0 before the new metadata arrives', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.duration = 123.456
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)

    const mockedSetDuration = jest.mocked(setDurationAction)
    mockedSetDuration.mockClear()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[1].element.duration = 90
    audioStubs[1].fireEvent(LOADED_METADATA_EVENT)

    expect(mockedSetDuration.mock.calls[0][1]).toBe(0)
    expect(mockedSetDuration.mock.calls[1][1]).toBe(90000)
    expect(mockedSetDuration.mock.invocationCallOrder[0]).toBeLessThan(
      mockedSetDuration.mock.invocationCallOrder[1],
    )
  })

  test('loadedmetadata persists the duration to AsyncStorage', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.duration = 60

    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CURRENT_SOUND_DURATION, '60000')
  })
})

describe('WebPlayerService auto-cache on play', () => {
  beforeEach(() => {
    // `jest.clearAllMocks()` does not reset the `ctx.get` implementation
    // installed by `mockOnlineStatus` — reset it here so stale implementations
    // cannot leak if this describe block is reordered before other blocks.
    ;(ctx.get as jest.Mock).mockReset()
  })

  test('uncached track while online triggers startBackgroundCaching', async () => {
    mockOnlineStatus(true)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)

    await playerService.loadAudio(AUDIO_URL)
    await flushAutoCache()

    expect(startBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('cached track does NOT trigger startBackgroundCaching', async () => {
    mockOnlineStatus(true)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)

    await playerService.loadAudio(AUDIO_URL)
    await flushAutoCache()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
  })

  test('uncached track while offline does NOT trigger startBackgroundCaching', async () => {
    mockOnlineStatus(false)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)

    await playerService.loadAudio(AUDIO_URL)
    await flushAutoCache()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
  })

  test('replaceAudio also triggers startBackgroundCaching for an uncached online track', async () => {
    mockOnlineStatus(true)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)

    await playerService.replaceAudio(AUDIO_URL)
    await flushAutoCache()

    expect(startBackgroundCaching).toHaveBeenCalledWith(AUDIO_URL)
  })
})

describe('WebPlayerService recoverStreamAfterReconnect', () => {
  test('null URL does nothing', async () => {
    await playerService.loadAudio(AUDIO_URL)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect('')

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('healthy playing stream does nothing', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].fireEvent(PLAY_EVENT)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('paused stream swaps source without resuming', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].element.currentTime = 42
    audioStubs[0].fireEvent('timeupdate')
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).toHaveBeenCalledWith(AUDIO_URL, 42000)
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('stalled stream swaps source and resumes', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].element.currentTime = 12
    audioStubs[0].fireEvent('timeupdate')
    audioStubs[0].fireEvent(PLAY_EVENT)
    audioStubs[0].fireEvent('waiting')
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).toHaveBeenCalledWith(AUDIO_URL, 12000)
    expect(playSpy).toHaveBeenCalled()
  })

  test('offline-stalled stream (flag set, isPlaying false) swaps source and resumes', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].element.currentTime = 12
    audioStubs[0].fireEvent('timeupdate')
    mockStalledOffline(true)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).toHaveBeenCalledWith(AUDIO_URL, 12000)
    expect(playSpy).toHaveBeenCalled()
  })

  test('offline-stalled heal clears the flag after capture', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    mockStalledOffline(true)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).toHaveBeenCalled()
    expect(playSpy).toHaveBeenCalled()
    expect(setIsStalledOfflineAction).toHaveBeenCalledWith(expect.anything(), false)
  })

  test('no audio instance returns early', async () => {
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(AUDIO_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })
})

describe('WebPlayerService element error/waiting/playing events', () => {
  test("dispatching 'error' sets state isPlaying=false", async () => {
    mockOnlineStatus(true)
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    audioStubs[0].fireEvent('error')

    expect(setIsPlayingAction).toHaveBeenCalledWith(expect.anything(), false)
  })

  test("dispatching 'error' while offline sets the stall flag", async () => {
    mockOnlineStatus(false)
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    audioStubs[0].fireEvent('error')

    expect(setIsStalledOfflineAction).toHaveBeenCalledWith(expect.anything(), true)
  })

  test("dispatching 'error' while online does not set the stall flag", async () => {
    mockOnlineStatus(true)
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    audioStubs[0].fireEvent('error')

    expect(setIsStalledOfflineAction).not.toHaveBeenCalled()
  })

  test("dispatching 'waiting' sets isBuffering=true", async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].fireEvent('waiting')

    expect(setIsBufferingAction).toHaveBeenCalledWith(expect.anything(), true)
  })

  test("dispatching 'playing' clears isBuffering and the stall flag", async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(LOADED_METADATA_EVENT)
    audioStubs[0].fireEvent('waiting')
    audioStubs[0].fireEvent('playing')

    expect(setIsBufferingAction).toHaveBeenCalledWith(expect.anything(), false)
    expect(setIsStalledOfflineAction).toHaveBeenCalledWith(expect.anything(), false)
  })

  test('events from a stale (detached) element do not mutate state', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    await playerService.loadAudio(AUDIO_URL)

    const mockedSetIsPlaying = jest.mocked(setIsPlayingAction)
    const mockedSetIsBuffering = jest.mocked(setIsBufferingAction)
    const mockedSetIsStalledOffline = jest.mocked(setIsStalledOfflineAction)
    mockedSetIsPlaying.mockClear()
    mockedSetIsBuffering.mockClear()
    mockedSetIsStalledOffline.mockClear()

    audioStubs[0].fireEvent('error')
    audioStubs[0].fireEvent('waiting')
    audioStubs[0].fireEvent('playing')

    expect(mockedSetIsPlaying).not.toHaveBeenCalled()
    expect(mockedSetIsBuffering).not.toHaveBeenCalled()
    expect(mockedSetIsStalledOffline).not.toHaveBeenCalled()
  })
})
