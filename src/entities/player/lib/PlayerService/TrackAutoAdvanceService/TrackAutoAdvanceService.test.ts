import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE } from 'shared/config'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { isOnlineAtom } from 'shared/model/network'
import { trackAutoAdvanceService } from './TrackAutoAdvanceService'

const mockGuardOfflinePlayback = jest.fn()
const mockPlayNextTrack = jest.fn().mockResolvedValue(undefined)
const mockRepeatCurrentTrack = jest.fn().mockResolvedValue(undefined)
const mockPlayFirstTrackInQueue = jest.fn().mockResolvedValue(undefined)
const mockMarkHistoryCompleted = jest.fn()
const mockCtxGet = jest.fn()

jest.mock('shared/lib/reatom-ctx', () => ({
  ctx: {
    get: (...args: unknown[]) => mockCtxGet(...args),
    schedule: jest.fn((fn: () => void) => Promise.resolve().then(fn)),
  },
}))

jest.mock('shared/model/network', () => ({
  isOnlineAtom: '@@TEST_IS_ONLINE_ATOM',
}))

jest.mock('../../../model', () => ({
  durationAtom: '@@TEST_DURATION_ATOM',
  positionAtom: '@@TEST_POSITION_ATOM',
  RepeatMode: { Off: 'off', Queue: 'queue', Track: 'track' },
  repeatModeSchema: {
    safeParse: (value: string | undefined) => {
      if (value === 'queue') return { data: 'queue' }
      if (value === 'track') return { data: 'track' }
      return { data: 'off' }
    },
  },
}))

jest.mock('entities/listening-history/@x/player', () => ({
  markHistoryCompletedAction: (...args: unknown[]) => mockMarkHistoryCompleted(...args),
}))

jest.mock('../../playOfflineGuard', () => ({
  guardOfflinePlayback: (...args: unknown[]) => mockGuardOfflinePlayback(...args),
}))

jest.mock('./playback', () => ({
  playFirstTrackInQueue: (...args: unknown[]) => mockPlayFirstTrackInQueue(...args),
  playNextTrack: (...args: unknown[]) => mockPlayNextTrack(...args),
  repeatCurrentTrack: (...args: unknown[]) => mockRepeatCurrentTrack(...args),
}))

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

const playerActions = {
  pause: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  replaceAudio: jest.fn().mockResolvedValue(null),
}

interface SeedOptions {
  currentAudio?: AudioPlayerData
  repeatMode?: string
  sermons?: PlaylistData['sermons']
}

const seedStorage = async ({
  currentAudio: seedAudio = audio,
  repeatMode = 'off',
  sermons = playlist.sermons,
}: SeedOptions = {}): Promise<void> => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(seedAudio))
  await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify({ ...playlist, sermons }))
  await AsyncStorage.setItem(CURRENT_REPEAT_MODE, repeatMode)
}

const setOnline = (online: boolean): void => {
  mockCtxGet.mockImplementation((atom: unknown) => (atom === isOnlineAtom ? online : 0))
}

describe('TrackAutoAdvanceService offline guard', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    trackAutoAdvanceService.setPlayerActions(playerActions)
  })

  test('blocks auto-advance when offline and next track not cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(true)
    await seedStorage()

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(secondAudio.audioUrl, false)
    expect(mockPlayNextTrack).not.toHaveBeenCalled()
  })

  test('auto-advances when offline and next track is cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(false)
    await seedStorage()

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(secondAudio.audioUrl, false)
    expect(mockPlayNextTrack).toHaveBeenCalled()
  })

  test('auto-advances when online even if next track not cached', async () => {
    setOnline(true)
    mockGuardOfflinePlayback.mockResolvedValue(false)
    await seedStorage()

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(secondAudio.audioUrl, true)
    expect(mockPlayNextTrack).toHaveBeenCalled()
  })

  test('preserves existing behavior when next track has no audioUrl', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(true)
    await seedStorage({ sermons: [audio, { ...secondAudio, audioUrl: undefined }] })

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).not.toHaveBeenCalled()
    expect(mockPlayNextTrack).not.toHaveBeenCalled()
  })

  test('blocks repeat-current-track when offline and current track not cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(true)
    await seedStorage({ repeatMode: 'track' })

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(audio.audioUrl, false)
    expect(mockRepeatCurrentTrack).not.toHaveBeenCalled()
    expect(mockGuardOfflinePlayback).toHaveBeenCalledTimes(1)
    expect(mockPlayNextTrack).not.toHaveBeenCalled()
    expect(mockPlayFirstTrackInQueue).not.toHaveBeenCalled()
  })

  test('repeats current track when offline and it is cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(false)
    await seedStorage({ repeatMode: 'track' })

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(audio.audioUrl, false)
    expect(mockRepeatCurrentTrack).toHaveBeenCalled()
    expect(mockGuardOfflinePlayback).toHaveBeenCalledTimes(1)
    expect(mockPlayNextTrack).not.toHaveBeenCalled()
    expect(mockPlayFirstTrackInQueue).not.toHaveBeenCalled()
  })

  test('blocks restart-queue when offline and first track not cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(true)
    await seedStorage({ currentAudio: secondAudio, repeatMode: 'queue' })

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(audio.audioUrl, false)
    expect(mockPlayFirstTrackInQueue).not.toHaveBeenCalled()
    expect(mockGuardOfflinePlayback).toHaveBeenCalledTimes(1)
    expect(playerActions.pause).not.toHaveBeenCalled()
    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })

  test('restarts queue when offline and first track is cached', async () => {
    setOnline(false)
    mockGuardOfflinePlayback.mockResolvedValue(false)
    await seedStorage({ currentAudio: secondAudio, repeatMode: 'queue' })

    await trackAutoAdvanceService.handleTrackEnd()

    expect(mockGuardOfflinePlayback).toHaveBeenCalledWith(audio.audioUrl, false)
    expect(mockPlayFirstTrackInQueue).toHaveBeenCalled()
    expect(mockGuardOfflinePlayback).toHaveBeenCalledTimes(1)
    expect(playerActions.pause).not.toHaveBeenCalled()
    expect(mockMarkHistoryCompleted).not.toHaveBeenCalled()
  })
})
