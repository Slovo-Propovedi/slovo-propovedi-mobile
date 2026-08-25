import { type AudioPlayer } from 'expo-audio'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { lockScreenControls } from '../LockScreenControls'
import {
  type OldTrackFlush,
  playFirstTrackInQueue,
  playNextTrack,
  playTrackWithMetadata,
  repeatCurrentTrack,
} from './playback'

const mockRecordSermonSwitch = jest.fn().mockResolvedValue(undefined)
const mockGetResumePosition = jest.fn().mockReturnValue(0)

const SENTINEL_HISTORY_ATOM = '@@TEST_HISTORY_ATOM'

let mockHistoryValue: unknown[] = []

jest.mock('entities/listening-history/@x/player', () => ({
  getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
  historyAtom: SENTINEL_HISTORY_ATOM,
  recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
}))

jest.mock('../LockScreenControls', () => ({
  lockScreenControls: {
    setMetadata: jest.fn(),
  },
}))

jest.mock('../../playbackProgress', () => ({
  savePlaybackProgress: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('shared/lib/reatom-ctx', () => ({
  ctx: {
    get: (atom: unknown) => {
      if (atom === SENTINEL_HISTORY_ATOM) return mockHistoryValue
      return undefined
    },
    schedule: jest.fn((fn: () => void) => Promise.resolve().then(fn)),
  },
}))

jest.mock('../../../model', () => ({
  setCurrentAudioAction: jest.fn().mockResolvedValue(undefined),
}))

const setMetadataMock = jest.mocked(lockScreenControls.setMetadata)

const mockPlay = jest.fn().mockResolvedValue(undefined)
const mockReplaceAudio = jest.fn().mockResolvedValue(null)

const playerActions = {
  pause: jest.fn().mockResolvedValue(undefined),
  play: mockPlay,
  replaceAudio: mockReplaceAudio,
}

const audio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const secondAudio: AudioPlayerData = {
  artist: 'Author 2',
  artwork: 'https://example.com/art2.jpg',
  audioUrl: 'https://example.com/audio2.mp3',
  id: 'sermon-2',
  title: 'Test Sermon 2',
}

const playlist: PlaylistData = {
  artwork: 'https://example.com/playlist-art.jpg',
  description: 'Test playlist',
  id: 'playlist-1',
  sermons: [audio, secondAudio],
  title: 'Test Playlist',
}

const oldFlush: OldTrackFlush = {
  oldDurationMs: 100000,
  oldPositionMs: 50000,
  oldSermonId: 'sermon-0',
}

const PARTIAL_HISTORY_ENTRY = {
  durationMs: 100000,
  lastPlayedAt: Date.now(),
  playlist,
  positionMs: 50000,
  sermon: secondAudio,
}

describe('playTrackWithMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplaceAudio.mockResolvedValue(null)
    mockHistoryValue = []
    mockGetResumePosition.mockReturnValue(0)
  })

  test('calls setMetadata AFTER play in the auto-advance path', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)

    await playTrackWithMetadata(playerActions, audio, playlist, audio.audioUrl, 0, oldFlush)

    expect(setMetadataMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      mockPlay.mock.invocationCallOrder[0],
    )
  })

  test('passes the metadata payload with artwork through to setMetadata', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)

    await playTrackWithMetadata(playerActions, audio, playlist, audio.audioUrl, 0, oldFlush)

    expect(setMetadataMock).toHaveBeenCalledWith(player, {
      albumTitle: playlist.title,
      artist: audio.artist,
      artworkUrl: audio.artwork,
      title: audio.title,
    })
  })

  test('saves bound progress with the actual initialPositionMs before recordSermonSwitch', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    const { savePlaybackProgress } = jest.requireMock('../../playbackProgress') as {
      savePlaybackProgress: jest.Mock
    }

    await playTrackWithMetadata(playerActions, audio, playlist, audio.audioUrl, 50000, oldFlush)

    expect(savePlaybackProgress).toHaveBeenCalledTimes(1)
    expect(savePlaybackProgress).toHaveBeenCalledWith(expect.anything(), {
      positionMs: 50000,
      sermonId: audio.id,
    })
    expect(savePlaybackProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mockRecordSermonSwitch.mock.invocationCallOrder[0],
    )
    expect(savePlaybackProgress.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplaceAudio.mock.invocationCallOrder[0],
    )
  })

  test('saves bound progress with position 0 when initialPositionMs is 0 (default)', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    const { savePlaybackProgress } = jest.requireMock('../../playbackProgress') as {
      savePlaybackProgress: jest.Mock
    }

    await playTrackWithMetadata(playerActions, audio, playlist, audio.audioUrl, 0, oldFlush)

    expect(savePlaybackProgress).toHaveBeenCalledWith(expect.anything(), {
      positionMs: 0,
      sermonId: audio.id,
    })
  })
})

describe('playNextTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplaceAudio.mockResolvedValue(null)
    mockHistoryValue = []
    mockGetResumePosition.mockReturnValue(0)
  })

  test('with partial history entry → replaceAudio called with resumeMs', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    mockHistoryValue = [PARTIAL_HISTORY_ENTRY]
    mockGetResumePosition.mockReturnValue(50000)

    await playNextTrack(playerActions, secondAudio, playlist, secondAudio.audioUrl, oldFlush)

    expect(mockGetResumePosition).toHaveBeenCalledWith(mockHistoryValue, secondAudio.id)
    expect(mockReplaceAudio).toHaveBeenCalledWith(secondAudio.audioUrl, 50000)
  })

  test('with no history → replaceAudio called with 0', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)

    await playNextTrack(playerActions, secondAudio, playlist, secondAudio.audioUrl, oldFlush)

    expect(mockGetResumePosition).toHaveBeenCalledWith([], secondAudio.id)
    expect(mockReplaceAudio).toHaveBeenCalledWith(secondAudio.audioUrl, 0)
  })

  test('getResumePosition returns 0 → replaceAudio called with 0', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    mockGetResumePosition.mockReturnValue(0)

    await playNextTrack(playerActions, secondAudio, playlist, secondAudio.audioUrl, oldFlush)

    expect(mockReplaceAudio).toHaveBeenCalledWith(secondAudio.audioUrl, 0)
  })
})

describe('repeatCurrentTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplaceAudio.mockResolvedValue(null)
    mockHistoryValue = [PARTIAL_HISTORY_ENTRY]
    mockGetResumePosition.mockReturnValue(50000)
  })

  test('always passes 0 regardless of history', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)

    await repeatCurrentTrack(playerActions, audio, playlist, audio.audioUrl, oldFlush)

    expect(mockReplaceAudio).toHaveBeenCalledWith(audio.audioUrl, 0)
    expect(mockGetResumePosition).not.toHaveBeenCalled()
  })
})

describe('playFirstTrackInQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplaceAudio.mockResolvedValue(null)
    mockHistoryValue = []
    mockGetResumePosition.mockReturnValue(0)
  })

  test('with partial history entry → replaceAudio called with resumeMs', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    mockHistoryValue = [PARTIAL_HISTORY_ENTRY]
    mockGetResumePosition.mockReturnValue(50000)

    await playFirstTrackInQueue(playerActions, playlist, oldFlush)

    expect(mockGetResumePosition).toHaveBeenCalledWith(mockHistoryValue, audio.id)
    expect(mockReplaceAudio).toHaveBeenCalledWith(audio.audioUrl, 50000)
  })

  test('with no history → replaceAudio called with 0', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)

    await playFirstTrackInQueue(playerActions, playlist, oldFlush)

    expect(mockReplaceAudio).toHaveBeenCalledWith(audio.audioUrl, 0)
  })

  test('getResumePosition returns 0 → replaceAudio called with 0', async () => {
    const player = { isLoaded: true } as unknown as AudioPlayer
    mockReplaceAudio.mockResolvedValue(player)
    mockGetResumePosition.mockReturnValue(0)

    await playFirstTrackInQueue(playerActions, playlist, oldFlush)

    expect(mockReplaceAudio).toHaveBeenCalledWith(audio.audioUrl, 0)
  })
})
