import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, currentPlaylistAtom, RepeatMode, repeatModeAtom } from '../../../model'
import { handleWebTrackEnd } from './trackAutoAdvance'

const mockGuardOfflinePlayback = jest.fn()
const mockMarkHistoryCompleted = jest.fn()
const mockSetCurrentAudio = jest.fn()
const mockRecordSermonSwitch = jest.fn()
const mockSavePlaybackProgress = jest.fn()
const mockGetResumePosition = jest.fn()

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/model/network', () => ({ isOnlineAtom: 'IS_ONLINE_ATOM' }))

jest.mock('../../../model', () => ({
  currentAudioAtom: 'CURRENT_AUDIO_ATOM',
  currentPlaylistAtom: 'CURRENT_PLAYLIST_ATOM',
  durationAtom: 'DURATION_ATOM',
  positionAtom: 'POSITION_ATOM',
  RepeatMode: { Off: 'off', Queue: 'queue', Track: 'track' },
  repeatModeAtom: 'REPEAT_MODE_ATOM',
  setCurrentAudioAction: (...args: unknown[]) => mockSetCurrentAudio(...args),
}))

jest.mock('entities/listening-history/@x/player', () => ({
  COMPLETION_REMAINING_MS: 5000,
  getResumePosition: (...args: unknown[]) => mockGetResumePosition(...args),
  historyAtom: 'HISTORY_ATOM',
  markHistoryCompletedAction: (...args: unknown[]) => mockMarkHistoryCompleted(...args),
  recordSermonSwitchAction: (...args: unknown[]) => mockRecordSermonSwitch(...args),
  sermonProgressAtom: 'SERMON_PROGRESS_ATOM',
}))

jest.mock('../../playOfflineGuard', () => ({
  guardOfflinePlayback: (...args: unknown[]) => mockGuardOfflinePlayback(...args),
}))

jest.mock('../../playbackProgress', () => ({
  savePlaybackProgress: (...args: unknown[]) => mockSavePlaybackProgress(...args),
}))

const FIRST_AUDIO_URL = 'https://example.com/first.mp3'
const SECOND_AUDIO_URL = 'https://example.com/second.mp3'
const DURATION_MS = 60000

const createSermon = (id: string, audioUrl: string): AudioPlayerData => ({
  artist: `Artist ${id}`,
  artwork: `${id}.jpg`,
  audioUrl,
  id,
  title: `Sermon ${id}`,
})

const sermons: AudioPlayerData[] = [
  createSermon('sermon-1', FIRST_AUDIO_URL),
  createSermon('sermon-2', SECOND_AUDIO_URL),
]

const playlist: PlaylistData = {
  artwork: 'playlist.jpg',
  id: 'playlist-1',
  sermons,
  title: 'Test Playlist',
}

interface AtomState {
  currentAudio: AudioPlayerData | null
  currentPlaylist: null | PlaylistData
  isOnline: boolean
  repeatMode: RepeatMode
}

const state: AtomState = {
  currentAudio: sermons[0],
  currentPlaylist: playlist,
  isOnline: true,
  repeatMode: RepeatMode.Off,
}

const applyAtomState = () => {
  ;(ctx.get as jest.Mock).mockImplementation(atom => {
    if (atom === currentAudioAtom) return state.currentAudio
    if (atom === currentPlaylistAtom) return state.currentPlaylist
    if (atom === isOnlineAtom) return state.isOnline
    if (atom === repeatModeAtom) return state.repeatMode
    return undefined
  })
}

const createService = () => ({
  getStatus: jest.fn(() => ({ duration: DURATION_MS, isPlaying: false, position: DURATION_MS })),
  pause: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  replaceAudio: jest.fn().mockResolvedValue(null),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setLockScreenMetadata: jest.fn(),
})

describe('handleWebTrackEnd', () => {
  let service: ReturnType<typeof createService>

  beforeEach(() => {
    jest.clearAllMocks()
    service = createService()
    mockGuardOfflinePlayback.mockResolvedValue(false)
    mockGetResumePosition.mockReturnValue(0)
    mockSetCurrentAudio.mockResolvedValue(undefined)
    mockMarkHistoryCompleted.mockResolvedValue(undefined)
    mockRecordSermonSwitch.mockResolvedValue(undefined)
    mockSavePlaybackProgress.mockResolvedValue(undefined)
    state.currentAudio = sermons[0]
    state.currentPlaylist = playlist
    state.isOnline = true
    state.repeatMode = RepeatMode.Off
    applyAtomState()
  })

  test('repeat track restarts the same track instead of switching', async () => {
    state.repeatMode = RepeatMode.Track

    await handleWebTrackEnd(service)

    expect(service.seekTo).toHaveBeenCalledWith(0)
    expect(service.play).toHaveBeenCalled()
    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })

  test('repeat queue advances to the next track', async () => {
    state.repeatMode = RepeatMode.Queue

    await handleWebTrackEnd(service)

    expect(service.replaceAudio).toHaveBeenCalledWith(SECOND_AUDIO_URL, 0)
    expect(service.play).toHaveBeenCalled()
    expect(mockSetCurrentAudio).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'sermon-2' }),
    )
    expect(mockRecordSermonSwitch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ markOldCompleted: true, oldSermonId: 'sermon-1' }),
    )
  })

  test('repeat queue wraps from the last track to the first', async () => {
    state.repeatMode = RepeatMode.Queue
    state.currentAudio = sermons[1]

    await handleWebTrackEnd(service)

    expect(service.replaceAudio).toHaveBeenCalledWith(FIRST_AUDIO_URL, 0)
  })

  test('repeat queue while offline stays guarded and does not switch', async () => {
    state.repeatMode = RepeatMode.Queue
    state.isOnline = false
    mockGuardOfflinePlayback.mockResolvedValue(true)

    await handleWebTrackEnd(service)

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(SECOND_AUDIO_URL, false)
    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()
    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })

  test('repeat off completes the ended track and pauses instead of advancing', async () => {
    state.repeatMode = RepeatMode.Off

    await handleWebTrackEnd(service)

    expect(mockMarkHistoryCompleted).toHaveBeenCalledWith(
      expect.anything(),
      'sermon-1',
      DURATION_MS,
      expect.objectContaining({ id: 'sermon-1' }),
      playlist,
    )
    expect(service.pause).toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()
    expect(service.replaceAudio).not.toHaveBeenCalled()
  })

  test('repeat off marks the same ended track only once', async () => {
    state.repeatMode = RepeatMode.Off

    await handleWebTrackEnd(service)
    await handleWebTrackEnd(service)

    expect(mockMarkHistoryCompleted).toHaveBeenCalledTimes(1)
  })

  test('repeat off completes again after a different track ends', async () => {
    state.repeatMode = RepeatMode.Off

    await handleWebTrackEnd(service)
    state.currentAudio = sermons[1]
    await handleWebTrackEnd(service)

    expect(mockMarkHistoryCompleted).toHaveBeenCalledTimes(2)
    expect(mockMarkHistoryCompleted.mock.calls.map(call => call[1])).toEqual([
      'sermon-1',
      'sermon-2',
    ])
  })

  test('an in-flight advance ignores a second ended event', async () => {
    state.repeatMode = RepeatMode.Queue

    await Promise.all([handleWebTrackEnd(service), handleWebTrackEnd(service)])

    expect(service.replaceAudio).toHaveBeenCalledTimes(1)
  })

  test('no current audio is a silent no-op', async () => {
    state.currentAudio = null

    await handleWebTrackEnd(service)

    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
    expect(service.pause).not.toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()
  })

  test('queue mode without a playlist is a silent no-op', async () => {
    state.repeatMode = RepeatMode.Queue
    state.currentPlaylist = null

    await handleWebTrackEnd(service)

    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()
  })

  test('queue mode when the ended track is absent from the playlist is a no-op', async () => {
    state.repeatMode = RepeatMode.Queue
    state.currentAudio = createSermon('outside-playlist', 'https://example.com/outside.mp3')

    await handleWebTrackEnd(service)

    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })
})
