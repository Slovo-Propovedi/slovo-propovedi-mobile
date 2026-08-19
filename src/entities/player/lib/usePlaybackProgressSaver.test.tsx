import { type Ctx } from '@reatom/framework'
import { act, renderHook } from '@testing-library/react-native'
import { type AudioPlayerData } from 'entities/player'
import { currentAudioAtom, durationAtom, isPlayingAtom, positionAtom } from '../model'
import { usePlaybackProgressSaver } from './usePlaybackProgressSaver'

const mockUpdateHistoryProgress = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/listening-history', () => ({
  updateHistoryProgressAction: (...args: unknown[]) => mockUpdateHistoryProgress(...args),
}))

jest.mock('shared/lib/reatom-ctx', () => {
  const { createCtx } = jest.requireActual('@reatom/framework')
  return { ctx: createCtx() }
})

const testCtx = (jest.requireMock('shared/lib/reatom-ctx') as { ctx: Ctx }).ctx

const SERMON_ID = 'sermon-1'
const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: SERMON_ID,
  title: 'Test Sermon',
}

const seedAtoms = (opts?: {
  audio?: AudioPlayerData
  duration?: number
  isPlaying?: boolean
  position?: number
}) => {
  const { audio = mockAudio, duration = 0, isPlaying = false, position = 0 } = opts ?? {}
  currentAudioAtom(testCtx, audio)
  durationAtom(testCtx, duration)
  isPlayingAtom(testCtx, isPlaying)
  positionAtom(testCtx, position)
}

describe('usePlaybackProgressSaver', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    seedAtoms()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('saves position when playing and position > 0', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 30000 })
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockUpdateHistoryProgress).toHaveBeenCalledTimes(1)
    expect(mockUpdateHistoryProgress).toHaveBeenCalledWith(testCtx, {
      durationMs: 120000,
      positionMs: 30000,
      sermonId: SERMON_ID,
    })
  })

  test('does not save when paused', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: false, position: 30000 })
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockUpdateHistoryProgress).not.toHaveBeenCalled()
  })

  test('does not save when position <= 0', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 0 })
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockUpdateHistoryProgress).not.toHaveBeenCalled()
  })

  test('clears interval on unmount', async () => {
    const { unmount } = await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 30000 })
    })

    await act(async () => {
      unmount()
    })

    mockUpdateHistoryProgress.mockClear()

    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    expect(mockUpdateHistoryProgress).not.toHaveBeenCalled()
  })
})
