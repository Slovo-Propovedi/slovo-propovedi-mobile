import { type AudioPlaylist } from 'expo-audio'
import { setPositionAction, setSeekTargetAction } from '../../../model'
import { playlistEngine } from './PlaylistEngine'
import { replaceQueueTrack } from './queueLoader'
import { findQueueIndex } from './queueSwitch'
import { seekGuard } from './SeekGuard'

const AUDIO_URL = 'https://example.com/audio.mp3'
const RESUME_MS = 30_000
const TARGET_INDEX = 2
const STALE_INDEX = 0
const POLL_MS = 50

const playlist = { destroy: jest.fn() } as unknown as AudioPlaylist

jest.mock('expo-audio', () => ({ createAudioPlaylist: jest.fn() }))

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('../../../model', () => ({
  currentAudioAtom: jest.fn(),
  setIsSeekingAction: jest.fn(),
  setPositionAction: jest.fn(),
  setSeekTargetAction: jest.fn(),
}))

jest.mock('./PlaybackController', () => ({
  playbackController: {
    applyPreferences: jest.fn(),
    applyVolume: jest.fn(),
    getVolume: jest.fn(),
  },
}))

jest.mock('./audioEffectsAttach', () => ({ audioEffectsAttach: { detach: jest.fn() } }))

jest.mock('../BackgroundCachingService', () => ({ startBackgroundCaching: jest.fn() }))

jest.mock('./queueContext', () => ({ readQueueContext: jest.fn() }))

jest.mock('./queueSwitch', () => ({ findQueueIndex: jest.fn() }))

jest.mock('./SeekGuard', () => ({ seekGuard: { arm: jest.fn(), clear: jest.fn() } }))

jest.mock('./PlaylistEngine', () => ({
  playlistEngine: {
    getCurrentIndex: jest.fn(),
    getPlaylist: jest.fn(),
    seekTo: jest.fn(),
    skipToIndex: jest.fn(),
  },
}))

const mockGetCurrentIndex = jest.mocked(playlistEngine.getCurrentIndex)
const mockSeekTo = jest.mocked(playlistEngine.seekTo)
const mockSkipToIndex = jest.mocked(playlistEngine.skipToIndex)

const callOrder = (mock: { mock: { invocationCallOrder: number[] } }): number =>
  mock.mock.invocationCallOrder[0]

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  jest.mocked(findQueueIndex).mockResolvedValue(TARGET_INDEX)
  jest.mocked(playlistEngine.getPlaylist).mockReturnValue(playlist)
  mockSeekTo.mockResolvedValue(undefined)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('replaceQueueTrack queue skip settling', () => {
  test('seeks only after the engine reports the target index', async () => {
    mockGetCurrentIndex
      .mockReturnValueOnce(STALE_INDEX)
      .mockReturnValueOnce(STALE_INDEX)
      .mockReturnValue(TARGET_INDEX)

    const pending = replaceQueueTrack(AUDIO_URL, RESUME_MS)
    await jest.advanceTimersByTimeAsync(0)

    expect(mockSkipToIndex).toHaveBeenCalledWith(TARGET_INDEX)
    expect(mockSeekTo).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(POLL_MS)
    await pending

    expect(mockSeekTo).toHaveBeenCalledWith(RESUME_MS / 1000)
    // getCurrentIndex call #0 is the pre-skip check; #1 is the first poll after skipToIndex.
    const firstPollOrder = mockGetCurrentIndex.mock.invocationCallOrder[1]
    expect(callOrder(mockSkipToIndex)).toBeLessThan(firstPollOrder)
    expect(firstPollOrder).toBeLessThan(callOrder(mockSeekTo))
  })

  test('seeks after the bounded wait when the engine never reaches the target', async () => {
    mockGetCurrentIndex.mockReturnValue(STALE_INDEX)

    const pending = replaceQueueTrack(AUDIO_URL, RESUME_MS)
    await jest.advanceTimersByTimeAsync(950)

    expect(mockSeekTo).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(POLL_MS)
    await pending

    expect(mockSeekTo).toHaveBeenCalledWith(RESUME_MS / 1000)
  })

  test('arms the seek guard and sets the seek target before seeking', async () => {
    mockGetCurrentIndex
      .mockReturnValueOnce(STALE_INDEX)
      .mockReturnValueOnce(STALE_INDEX)
      .mockReturnValue(TARGET_INDEX)

    const pending = replaceQueueTrack(AUDIO_URL, RESUME_MS)
    await jest.advanceTimersByTimeAsync(POLL_MS)
    await pending

    expect(seekGuard.arm).toHaveBeenCalled()
    expect(setSeekTargetAction).toHaveBeenCalledWith(expect.anything(), RESUME_MS)
    expect(setPositionAction).toHaveBeenCalledWith(expect.anything(), RESUME_MS)
    expect(callOrder(jest.mocked(seekGuard.arm))).toBeLessThan(callOrder(mockSeekTo))
    expect(callOrder(jest.mocked(setSeekTargetAction))).toBeLessThan(callOrder(mockSeekTo))
    expect(callOrder(jest.mocked(setPositionAction))).toBeLessThan(callOrder(mockSeekTo))
  })
})
