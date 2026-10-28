import AsyncStorage from '@react-native-async-storage/async-storage'
import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST } from 'shared/config'
import { playlistEngine } from '../PlaylistEngine'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService'

const HISTORY_ATOM = '@@TEST_HISTORY_ATOM'
const mockGetResumePosition = jest.fn().mockReturnValue(0)
const mockMarkHistoryCompleted = jest.fn().mockResolvedValue(undefined)
const mockRecordSermonSwitch = jest.fn().mockResolvedValue(undefined)
const mockSavePlaybackProgress = jest.fn().mockResolvedValue(undefined)
const mockStartBackgroundCaching = jest.fn()
const mockSetMetadata = jest.fn()

jest.mock('shared/lib/reatom-ctx', () => ({
  ctx: { get: (atom: unknown) => (atom === HISTORY_ATOM ? [] : undefined) },
}))

jest.mock('entities/listening-history/@x/player', () => ({
  COMPLETION_REMAINING_MS: 5000,
  getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
  historyAtom: HISTORY_ATOM,
  markHistoryCompletedAction: (...args: unknown[]) => mockMarkHistoryCompleted(...args),
  recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
}))

jest.mock('../../../../model', () => ({
  currentPlaylistAtom: '@@TEST_CURRENT_PLAYLIST_ATOM',
  setCurrentAudioAction: jest.fn(),
}))
jest.mock('../../../playbackProgress', () => ({
  savePlaybackProgress: (...args: unknown[]) => mockSavePlaybackProgress(...args),
}))
jest.mock('../../BackgroundCachingService', () => ({
  startBackgroundCaching: (...args: unknown[]) => mockStartBackgroundCaching(...args),
}))
jest.mock('../LockScreenControls', () => ({
  lockScreenControls: { setMetadata: (...args: unknown[]) => mockSetMetadata(...args) },
}))
jest.mock('./parsers', () => ({
  parseAudioPlayerData: (raw: null | string) => (raw ? JSON.parse(raw) : null),
  parsePlaylistData: (raw: null | string) => (raw ? JSON.parse(raw) : null),
}))

const mockPlaylist = { title: 'Playlist' } as unknown as PlaylistData

jest.mock('../PlaylistEngine', () => ({
  playlistEngine: {
    getCurrentIndex: jest.fn(),
    getLoop: jest.fn(),
    getPlaylist: jest.fn(() => mockPlaylist),
    getSnapshot: jest.fn(),
    getStatus: jest.fn(),
    getTrackAt: jest.fn(),
    getTrackCount: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  },
}))

const audio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon 1',
}

const secondAudio: AudioPlayerData = {
  artist: 'Author 2',
  artwork: 'https://example.com/art2.jpg',
  audioUrl: 'https://example.com/audio2.mp3',
  id: 'sermon-2',
  title: 'Sermon 2',
}

const playlist: PlaylistData = {
  artwork: 'https://example.com/playlist-art.jpg',
  description: 'Test playlist',
  id: 'playlist-1',
  sermons: [audio, secondAudio],
  title: 'Test Playlist',
}

const mockedEngine = jest.mocked(playlistEngine)

const seedStorage = async (current: AudioPlayerData): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(current))
  await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(playlist))
}

const setTracks = (tracks: AudioPlayerData[]): void => {
  mockedEngine.getTrackAt.mockImplementation(index => tracks[index] ?? null)
  mockedEngine.getTrackCount.mockReturnValue(tracks.length)
}

const setStatus = (durationMs: number): void => {
  mockedEngine.getStatus.mockReturnValue({
    durationMs,
    isBuffering: false,
    isLoaded: true,
    isPlaying: true,
    playbackRate: 1,
    positionMs: 0,
    volume: 1,
  })
}

describe('TrackAutoAdvanceService.handleTrackChanged', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    mockGetResumePosition.mockReturnValue(0)
    setTracks([audio, secondAudio])
    setStatus(100000)
    mockedEngine.getSnapshot.mockImplementation(index =>
      index === 0 ? { currentTime: 50, duration: 100 } : null,
    )
  })

  test('flushes the old track from the engine snapshot values', async () => {
    await seedStorage(audio)

    await trackAutoAdvanceService.handleTrackChanged(0, 1)

    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        markOldCompleted: true,
        oldDurationMs: 100000,
        oldPositionMs: 50000,
        oldSermonId: audio.id,
      }),
    )
  })

  test('writes the new track with the playlist artwork and arms background caching', async () => {
    await seedStorage(audio)

    await trackAutoAdvanceService.handleTrackChanged(0, 1)

    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        newAudio: { ...secondAudio, artwork: playlist.artwork },
      }),
    )
    expect(mockSetMetadata).toHaveBeenCalledWith(mockPlaylist, {
      albumTitle: playlist.title,
      artist: secondAudio.artist,
      artworkUrl: playlist.artwork,
      title: secondAudio.title,
    })
    expect(mockStartBackgroundCaching).toHaveBeenCalledWith(secondAudio.audioUrl)
  })

  test('seeks to the stored resume position before saving progress', async () => {
    await seedStorage(audio)
    mockGetResumePosition.mockReturnValue(30000)

    await trackAutoAdvanceService.handleTrackChanged(0, 1)

    expect(mockedEngine.seekTo).toHaveBeenCalledWith(30)
    expect(mockSavePlaybackProgress).toHaveBeenCalledWith(expect.anything(), {
      positionMs: 30000,
      sermonId: secondAudio.id,
    })
  })

  test('does not seek when the resume position is within the completion window', async () => {
    await seedStorage(audio)
    mockGetResumePosition.mockReturnValue(97000)

    await trackAutoAdvanceService.handleTrackChanged(0, 1)

    expect(mockedEngine.seekTo).not.toHaveBeenCalled()
  })

  test('ignores a switch already committed by the JS funnel (manual next/prev)', async () => {
    await seedStorage(secondAudio)

    await trackAutoAdvanceService.handleTrackChanged(0, 1)

    expect(mockRecordSermonSwitch).not.toHaveBeenCalled()
    expect(mockSetMetadata).not.toHaveBeenCalled()
    expect(mockStartBackgroundCaching).not.toHaveBeenCalled()
  })
})

describe('TrackAutoAdvanceService.handleQueueEnd', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    setTracks([audio, secondAudio])
    setStatus(100000)
    mockedEngine.getCurrentIndex.mockReturnValue(1)
    mockedEngine.getLoop.mockReturnValue('none')
    mockedEngine.getSnapshot.mockReturnValue({ currentTime: 100, duration: 100 })
  })

  test('marks the last track completed and pauses once', async () => {
    await trackAutoAdvanceService.handleQueueEnd()
    await trackAutoAdvanceService.handleQueueEnd()

    expect(mockMarkHistoryCompleted).toHaveBeenCalledTimes(1)
    expect(mockMarkHistoryCompleted).toHaveBeenCalledWith(
      expect.anything(),
      secondAudio.id,
      100000,
      secondAudio,
      undefined,
    )
    expect(mockedEngine.pause).toHaveBeenCalledTimes(1)
  })

  test('does nothing when the queue loops', async () => {
    mockedEngine.getLoop.mockReturnValue('all')

    await trackAutoAdvanceService.handleQueueEnd()

    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
    expect(mockedEngine.pause).not.toHaveBeenCalled()
  })

  test('does nothing when the queue is not at the last track', async () => {
    mockedEngine.getCurrentIndex.mockReturnValue(0)

    await trackAutoAdvanceService.handleQueueEnd()

    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })
})
