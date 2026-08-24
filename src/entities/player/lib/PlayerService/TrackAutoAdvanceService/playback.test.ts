import { type AudioPlayer } from 'expo-audio'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { lockScreenControls } from '../LockScreenControls'
import { type OldTrackFlush, playTrackWithMetadata } from './playback'

const mockRecordSermonSwitch = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/listening-history/@x/player', () => ({
  recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
}))

jest.mock('../LockScreenControls', () => ({
  lockScreenControls: {
    setMetadata: jest.fn(),
  },
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

const playlist: PlaylistData = {
  artwork: 'https://example.com/playlist-art.jpg',
  description: 'Test playlist',
  id: 'playlist-1',
  sermons: [],
  title: 'Test Playlist',
}

const oldFlush: OldTrackFlush = {
  oldDurationMs: 100000,
  oldPositionMs: 50000,
  oldSermonId: 'sermon-0',
}

describe('playTrackWithMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReplaceAudio.mockResolvedValue(null)
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
})
