import { type AudioPlaylist } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  currentAudioAtom,
  currentPlaylistAtom,
  isBufferingAtom,
  isPlayingAtom,
  isSeekingAtom,
  positionAtom,
  seekTargetPositionAtom,
} from '../../model'
import { isStalledOfflineAtom } from '../stalledOffline'
import { playerService } from './index.native'
import { lockScreenControls } from './native/LockScreenControls'
import { playbackController } from './native/PlaybackController'
import { playlistEngine } from './native/PlaylistEngine'
import { loadQueue, replaceQueueTrack } from './native/queueLoader'

jest.mock('./native/queueLoader', () => ({
  loadQueue: jest.fn(),
  replaceQueueTrack: jest.fn(),
}))

jest.mock('./native/PlaylistEngine', () => ({
  playlistEngine: {
    destroy: jest.fn(),
    getCurrentIndex: jest.fn(),
    getCurrentSourceUri: jest.fn(),
    getPlaylist: jest.fn(),
    getTrackAt: jest.fn(),
    isLoaded: jest.fn(),
    setLoopMode: jest.fn(),
  },
}))

jest.mock('./native/AudioModeManager', () => ({ audioModeManager: { configure: jest.fn() } }))

jest.mock('./native/LockScreenControls', () => ({
  lockScreenControls: { reassertMetadata: jest.fn() },
}))

jest.mock('./native/playlistStatusHandler', () => ({ wirePlaylistStatus: jest.fn() }))

const mockedLoadQueue = jest.mocked(loadQueue)
const mockedReplaceQueueTrack = jest.mocked(replaceQueueTrack)
const mockedEngine = jest.mocked(playlistEngine)

const createPlaylistStub = (): AudioPlaylist => ({ isLoaded: true }) as unknown as AudioPlaylist

const NEXT_AUDIO_URL = 'https://example.com/next.mp3'

describe('PlayerService loadAudio / replaceAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isSeekingAtom(ctx, false)
    seekTargetPositionAtom(ctx, null)
    mockedLoadQueue.mockResolvedValue(createPlaylistStub())
    mockedReplaceQueueTrack.mockResolvedValue(createPlaylistStub())
    mockedEngine.getPlaylist.mockReturnValue(createPlaylistStub())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('replaceAudio resets the seek guard so new track position events are not ignored', async () => {
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)
    const resetSpy = jest.spyOn(playbackController, 'resetSeekGuard')

    await playerService.replaceAudio(NEXT_AUDIO_URL)

    expect(resetSpy).toHaveBeenCalled()
  })

  test('preserveSeekGuard option skips the seek guard reset', async () => {
    const resetSpy = jest.spyOn(playbackController, 'resetSeekGuard')

    await playerService.replaceAudio(NEXT_AUDIO_URL, 0, { preserveSeekGuard: true })

    expect(resetSpy).not.toHaveBeenCalled()
  })

  test('loadAudio delegates to the queue loader and returns the playlist', async () => {
    const playlist = createPlaylistStub()
    mockedLoadQueue.mockResolvedValue(playlist)

    const result = await playerService.loadAudio(NEXT_AUDIO_URL, 5000)

    expect(mockedLoadQueue).toHaveBeenCalledWith(NEXT_AUDIO_URL, 5000)
    expect(result).toBe(playlist)
  })

  test('replaceAudio delegates the in-queue switch to the queue loader', async () => {
    await playerService.replaceAudio(NEXT_AUDIO_URL, 42000)

    expect(mockedReplaceQueueTrack).toHaveBeenCalledWith(NEXT_AUDIO_URL, 42000)
  })

  test('setRepeatMode maps the app mode onto the native loop', () => {
    playerService.setRepeatMode('queue')
    expect(mockedEngine.setLoopMode).toHaveBeenCalledWith('all')

    playerService.setRepeatMode('track')
    expect(mockedEngine.setLoopMode).toHaveBeenCalledWith('single')

    playerService.setRepeatMode('off')
    expect(mockedEngine.setLoopMode).toHaveBeenCalledWith('none')
  })
})

describe('PlayerService.stop / unload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedEngine.getPlaylist.mockReturnValue(createPlaylistStub())
  })

  test('stop delegates the pause+reset to the controller', async () => {
    const stopSpy = jest.spyOn(playbackController, 'stop').mockResolvedValue(undefined)

    await playerService.stop()

    expect(stopSpy).toHaveBeenCalled()
  })

  test('unload destroys the native queue and the effects chain', async () => {
    await playerService.unload()

    expect(mockedEngine.destroy).toHaveBeenCalled()
  })
})

describe('PlayerService.recoverStreamAfterReconnect', () => {
  const NETWORK_URL = 'https://example.com/audio.mp3'
  const AUDIO_DATA = {
    artist: 'Author',
    artwork: null,
    audioUrl: NETWORK_URL,
    id: 'sermon-1',
    title: 'Test Sermon',
  }
  const reassertMetadataSpy = jest.mocked(lockScreenControls.reassertMetadata)

  beforeEach(() => {
    jest.clearAllMocks()
    currentAudioAtom(ctx, null)
    currentPlaylistAtom(ctx, null)
    isPlayingAtom(ctx, false)
    isBufferingAtom(ctx, false)
    positionAtom(ctx, 0)
    isStalledOfflineAtom(ctx, false)
    mockedEngine.getCurrentSourceUri.mockReturnValue(NETWORK_URL)
    mockedEngine.getCurrentIndex.mockReturnValue(-1)
    mockedEngine.getTrackAt.mockReturnValue(null)
    mockedEngine.isLoaded.mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('null URL does nothing', async () => {
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect('')

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('local file source does nothing', async () => {
    mockedEngine.getCurrentSourceUri.mockReturnValue('file:///cache/abc.mp3')
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('healthy playing stream does nothing', async () => {
    isPlayingAtom(ctx, true)
    isBufferingAtom(ctx, false)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(loadSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('paused stream swaps source without resuming', async () => {
    positionAtom(ctx, 42000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalledWith(NETWORK_URL, 42000)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
  })

  test('stalled stream swaps source and resumes', async () => {
    isPlayingAtom(ctx, true)
    isBufferingAtom(ctx, true)
    positionAtom(ctx, 1000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalledWith(NETWORK_URL, 1000)
    expect(playSpy).toHaveBeenCalled()
  })

  test('offline-stalled stream (flag set, isPlaying false) swaps source and resumes', async () => {
    isStalledOfflineAtom(ctx, true)
    positionAtom(ctx, 2000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalledWith(NETWORK_URL, 2000)
    expect(playSpy).toHaveBeenCalled()
  })

  test('never-loaded queue routes through loadAudio', async () => {
    mockedEngine.isLoaded.mockReturnValue(false)
    positionAtom(ctx, 5000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(loadSpy).toHaveBeenCalledWith(NETWORK_URL, 5000)
    expect(replaceSpy).not.toHaveBeenCalled()
  })

  test('heal targets the engine current track, not the stale passed URL', async () => {
    const STALE_URL = 'https://example.com/first.mp3'
    const ENGINE_URL = 'https://example.com/second.mp3'
    mockedEngine.getCurrentIndex.mockReturnValue(1)
    mockedEngine.getTrackAt.mockReturnValue({
      artist: 'Author 2',
      artwork: null,
      audioUrl: ENGINE_URL,
      id: 'sermon-2',
      title: 'Second Sermon',
    })
    positionAtom(ctx, 42000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)

    await playerService.recoverStreamAfterReconnect(STALE_URL)

    expect(replaceSpy).toHaveBeenCalledWith(ENGINE_URL, 42000)
  })

  test('successful replace heal re-asserts lock screen metadata after replaceAudio', async () => {
    currentAudioAtom(ctx, AUDIO_DATA)
    currentPlaylistAtom(ctx, {
      artwork: null,
      id: 'playlist-1',
      sermons: [],
      title: 'Test Playlist',
    })
    const replaceSpy = jest
      .spyOn(playerService, 'replaceAudio')
      .mockResolvedValue(createPlaylistStub())

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalled()
    expect(reassertMetadataSpy).toHaveBeenCalledTimes(1)
    expect(reassertMetadataSpy.mock.calls[0][1]).toEqual({
      albumTitle: 'Test Playlist',
      artist: AUDIO_DATA.artist,
      artworkUrl: null,
      title: AUDIO_DATA.title,
    })
  })

  test('replace heal failure (null playlist) does not re-assert lock screen metadata', async () => {
    currentAudioAtom(ctx, AUDIO_DATA)
    jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(reassertMetadataSpy).not.toHaveBeenCalled()
  })
})
