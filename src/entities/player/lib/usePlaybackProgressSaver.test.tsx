import AsyncStorage from '@react-native-async-storage/async-storage'
import { type Ctx } from '@reatom/framework'
import { act, renderHook } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { type AudioPlayerData } from 'shared/model'
import { currentAudioAtom, durationAtom, isPlayingAtom, positionAtom } from '../model'
import { usePlaybackProgressSaver } from './usePlaybackProgressSaver'

const mockWriteLiveProgressSnapshot = jest.fn()

jest.mock('entities/listening-history/@x/player', () => ({
  writeLiveProgressSnapshot: (...args: unknown[]) => mockWriteLiveProgressSnapshot(...args),
}))

jest.mock('shared/lib/reatom-ctx', () => {
  const { createCtx } = jest.requireActual('@reatom/framework')
  return { ctx: createCtx() }
})

const testCtx = (jest.requireMock('shared/lib/reatom-ctx') as { ctx: Ctx }).ctx

const mockedSetItem = jest.mocked(AsyncStorage.setItem)

const mockAppStateListeners: Array<(state: AppStateStatus) => void> = []

jest
  .spyOn(AppState, 'addEventListener')
  .mockImplementation((_event: string, cb: (state: AppStateStatus) => void) => {
    mockAppStateListeners.push(cb)
    return { remove: jest.fn() }
  })

const SERMON_ID = 'sermon-1'
const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: SERMON_ID,
  title: 'Test Sermon',
}

const mockAudio2: AudioPlayerData = {
  ...mockAudio,
  id: 'sermon-2',
  title: 'Test Sermon 2',
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

const advanceTimeAndFlush = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
  // Allow the void savePlaybackProgress promise to resolve
  await act(async () => {})
}

describe('usePlaybackProgressSaver', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockedSetItem.mockClear()
    mockAppStateListeners.length = 0
    seedAtoms()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('writes bound JSON with sermonId on tick', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 30000 })
    })

    await advanceTimeAndFlush(5000)

    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledTimes(1)
    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledWith({
      durationMs: 120000,
      positionMs: 30000,
      sermonId: SERMON_ID,
    })

    const setItemCall = mockedSetItem.mock.calls.find(([key]) => key === 'currentSoundPosition')
    expect(setItemCall).toBeTruthy()
    const storedValue = setItemCall ? setItemCall[1] : ''
    const parsed = JSON.parse(storedValue as string)
    expect(parsed).toMatchObject({
      durationMs: 120000,
      positionMs: 30000,
      sermonId: SERMON_ID,
    })
    expect(typeof parsed.savedAtMs).toBe('number')
  })

  test('does not save when paused', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: false, position: 30000 })
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockWriteLiveProgressSnapshot).not.toHaveBeenCalled()
  })

  test('does not save when position <= 0', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 0 })
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
    })

    expect(mockWriteLiveProgressSnapshot).not.toHaveBeenCalled()
  })

  test('skips first tick after audio id changes, calls on second tick', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ audio: mockAudio, duration: 120000, isPlaying: true, position: 30000 })
    })

    // First tick — should fire normally with initial audio
    await advanceTimeAndFlush(5000)

    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledTimes(1)
    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledWith({
      durationMs: 120000,
      positionMs: 30000,
      sermonId: SERMON_ID,
    })

    // Change audio id — next tick should be skipped
    await act(async () => {
      seedAtoms({ audio: mockAudio2, duration: 200000, isPlaying: true, position: 10000 })
    })

    await advanceTimeAndFlush(5000)

    // Still only 1 call — the tick after id change was skipped
    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledTimes(1)

    // Second tick after id change — should fire
    await advanceTimeAndFlush(5000)

    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledTimes(2)
    expect(mockWriteLiveProgressSnapshot).toHaveBeenLastCalledWith({
      durationMs: 200000,
      positionMs: 10000,
      sermonId: 'sermon-2',
    })
  })

  test('flushes on AppState change to background', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 55000 })
    })

    await advanceTimeAndFlush(0)

    await act(async () => {
      for (const listener of mockAppStateListeners) listener('background')
    })
    await advanceTimeAndFlush(0)

    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledTimes(1)
    expect(mockWriteLiveProgressSnapshot).toHaveBeenCalledWith({
      durationMs: 120000,
      positionMs: 55000,
      sermonId: SERMON_ID,
    })

    const setItemCall = mockedSetItem.mock.calls.find(([key]) => key === 'currentSoundPosition')
    expect(setItemCall).toBeTruthy()
    const storedValue = setItemCall ? setItemCall[1] : ''
    const parsed = JSON.parse(storedValue as string)
    expect(parsed).toMatchObject({
      durationMs: 120000,
      positionMs: 55000,
      sermonId: SERMON_ID,
    })
  })

  test('does not flush on AppState change to inactive', async () => {
    await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 55000 })
    })

    await advanceTimeAndFlush(0)

    await act(async () => {
      for (const listener of mockAppStateListeners) listener('inactive')
    })
    await advanceTimeAndFlush(0)

    expect(mockWriteLiveProgressSnapshot).not.toHaveBeenCalled()
  })

  test('clears interval on unmount', async () => {
    const { unmount } = await renderHook(() => usePlaybackProgressSaver())

    await act(async () => {
      seedAtoms({ duration: 120000, isPlaying: true, position: 30000 })
    })

    await act(async () => {
      unmount()
    })

    mockWriteLiveProgressSnapshot.mockClear()

    await act(async () => {
      jest.advanceTimersByTime(10000)
    })

    expect(mockWriteLiveProgressSnapshot).not.toHaveBeenCalled()
  })
})
