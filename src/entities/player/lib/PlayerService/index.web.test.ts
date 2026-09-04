import AsyncStorage from '@react-native-async-storage/async-storage'
import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom, setDurationAction } from '../../model'
import { savePlaybackProgress } from '../playbackProgress'
import { playerService } from './index.web'
import { scheduleHistoryFlush } from './progressFlusher'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('../../model', () => ({
  currentAudioAtom: jest.fn(),
  durationAtom: jest.fn(),
  setDurationAction: jest.fn(),
  setIsBufferingAction: jest.fn(),
  setIsPlayingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))

jest.mock('../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

jest.mock('../playbackProgress', () => ({ savePlaybackProgress: jest.fn() }))

jest.mock('entities/listening-history/@x/player', () => ({
  flushHistoryProgressAction: jest.fn(),
}))

jest.mock('./progressFlusher', () => ({ scheduleHistoryFlush: jest.fn() }))

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
] as const

interface AudioElementLike {
  addEventListener: (type: string, handler: () => void) => void
  currentTime: number
  duration: number
  pause: () => void
  play: () => Promise<void>
  playbackRate: number
  removeEventListener: (type: string, handler: () => void) => void
  src: string
}

interface AudioElementStub {
  element: AudioElementLike
  fireEvent: (type: string) => void
  pause: jest.Mock
  play: jest.Mock
}

const createAudioElementStub = (): AudioElementStub => {
  const listeners = new Map<string, Set<() => void>>()
  const pause = jest.fn()
  const play = jest.fn().mockResolvedValue(undefined)
  const addEventListener = jest.fn((type: string, handler: () => void) => {
    const set = listeners.get(type) ?? new Set<() => void>()
    set.add(handler)
    listeners.set(type, set)
  })
  const removeEventListener = jest.fn((type: string, handler: () => void) => {
    listeners.get(type)?.delete(handler)
  })
  const element: AudioElementLike = {
    addEventListener,
    currentTime: 0,
    duration: 0,
    pause,
    play,
    playbackRate: 1,
    removeEventListener,
    src: '',
  }
  const fireEvent = (type: string) => {
    listeners.get(type)?.forEach(handler => handler())
  }
  return { element, fireEvent, pause, play }
}

const mockSermonContext = () => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return { id: 'sermon-1' }
    if (atom === durationAtom) return 100000
    return undefined
  })
}

let audioStubs: AudioElementStub[]

beforeEach(async () => {
  jest.clearAllMocks()
  ;(ctx.get as jest.Mock).mockReset()
  audioStubs = []
  ;(global as { Audio: unknown }).Audio = jest.fn(() => {
    const stub = createAudioElementStub()
    audioStubs.push(stub)
    return stub.element
  })
  await playerService.unload()
  await playerService.pause()
})

afterEach(() => {
  delete (global as { Audio?: unknown }).Audio
})

describe('WebPlayerService pause flush', () => {
  test('pause event from a replaced element does not flush progress', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].fireEvent(PLAY_EVENT)
    await playerService.loadAudio(AUDIO_URL)

    audioStubs[0].fireEvent(PAUSE_EVENT)

    expect(savePlaybackProgress).not.toHaveBeenCalled()
    expect(flushHistoryProgressAction).not.toHaveBeenCalled()
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

    expect(savePlaybackProgress).not.toHaveBeenCalled()
    expect(flushHistoryProgressAction).not.toHaveBeenCalled()
  })

  test('external pause event while playing flushes with the element currentTime', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42
    audioStubs[0].fireEvent(PLAY_EVENT)

    audioStubs[0].fireEvent(PAUSE_EVENT)

    expect(savePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 42000 }),
    )
    expect(flushHistoryProgressAction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 42000 }),
    )
  })
})

describe('WebPlayerService stop and unload flush', () => {
  test('stop() flushes the pre-stop position before pause/reset', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42

    await playerService.stop()

    expect(savePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 42000 }),
    )
    expect(audioStubs[0].pause).toHaveBeenCalled()
    expect(audioStubs[0].element.currentTime).toBe(0)
  })

  test('unload() flushes the position before tearing down', async () => {
    mockSermonContext()

    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 12

    await playerService.unload()

    expect(savePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 12000 }),
    )
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

    expect(savePlaybackProgress).not.toHaveBeenCalled()
    expect(flushHistoryProgressAction).not.toHaveBeenCalled()
  })

  test('no-ops without a sermon id', async () => {
    await playerService.loadAudio(AUDIO_URL)
    audioStubs[0].element.currentTime = 42

    await playerService.pause()

    expect(savePlaybackProgress).not.toHaveBeenCalled()
    expect(flushHistoryProgressAction).not.toHaveBeenCalled()
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
