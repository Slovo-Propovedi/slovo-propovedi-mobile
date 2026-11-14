import { type AudioPlayer } from 'expo-audio'
import { audioCacheService, getPartialFileUri } from 'entities/offline-cache/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { mockConsole } from 'shared/mocks'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  isPlayingAtom,
  isSeekingAtom,
  seekTargetPositionAtom,
} from '../../../model'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { playbackController } from './PlaybackController'
import { playlistEngine } from './PlaylistEngine'
import { seekViaPartialSource, swapPartialForCachedSeek } from './seekViaPartialSource'
import { swapPartialForNetworkSeek } from './swapPartialForNetworkSeek'

jest.mock('entities/offline-cache/@x/player', () => ({
  audioCacheService: { getCachedUri: jest.fn(), isCached: jest.fn() },
  getPartialFileUri: jest.fn(),
  PART_SUFFIX: '.cache.mp3',
}))

jest.mock('./PlaylistEngine', () => ({
  playlistEngine: { getCurrentSourceUri: jest.fn() },
}))

jest.mock('../progressFlusher', () => ({
  flushProgress: jest.fn(),
  scheduleHistoryFlush: jest.fn(),
}))

jest.mock('./SeekGuard', () => ({
  seekGuard: { arm: jest.fn(), clear: jest.fn(), reset: jest.fn() },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_URL = 'https://example.com/other.mp3'
const PARTIAL_URI = 'file:///data/cache/abc.cache.mp3'
const CACHED_URI = 'file:///data/cache/abc.mp3'

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Test Sermon',
}

const mockedGetCurrentSourceUri = jest.mocked(playlistEngine.getCurrentSourceUri)
const mockedGetCachedUri = jest.mocked(audioCacheService.getCachedUri)
const mockedGetPartialFileUri = jest.mocked(getPartialFileUri)
const mockedIsCached = jest.mocked(audioCacheService.isCached)

const createPlayerStub = (): AudioPlayer =>
  ({ isLoaded: true, seekTo: jest.fn().mockResolvedValue(undefined) }) as unknown as AudioPlayer

const createSourceSwap = () => {
  const play = jest.fn().mockResolvedValue(undefined)
  const swapSource = jest.fn().mockResolvedValue(true)
  return { play, swapSource }
}

describe('PlaybackController offline seek via partial source', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isOnlineAtom(ctx, true)
    currentAudioAtom(ctx, null)
    isPlayingAtom(ctx, false)
    isSeekingAtom(ctx, false)
    seekTargetPositionAtom(ctx, null)
    setIsStalledOfflineAction(ctx, false)
    mockedGetCurrentSourceUri.mockReturnValue(AUDIO_URL)
    mockedGetPartialFileUri.mockResolvedValue(null)
    mockedGetCachedUri.mockResolvedValue(null)
    mockedIsCached.mockResolvedValue(false)
  })

  test('offline + network source + partial + playing → partial swap then play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(PARTIAL_URI, 60000)
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('successful swap clears the seek state (guard lifecycle owned by the swap)', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('offline + network source + partial + stall-paused → partial swap then play', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    setIsStalledOfflineAction(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(PARTIAL_URI, 60000)
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('offline + network source + partial + manually paused → swap, no play', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(PARTIAL_URI, 60000)
    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('online → normal seek path, no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
  })

  test('offline + already file:// source → normal seek path', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
  })

  test('offline + network source but no partial on disk → normal seek path', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(null)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
  })

  test('race: track switched while resolving partial → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const sourceSwap = createSourceSwap()

    await seekViaPartialSource(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })

  test('swap failure → no unhandled rejection, seek state cleared', async () => {
    mockConsole('error')
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.swapSource.mockRejectedValue(new Error('swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('partial source + full cached + playing → cached swap then play', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(CACHED_URI, 60000)
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + full cached + paused → cached swap, no play', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(CACHED_URI, 60000)
    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + full not cached + offline → normal seek path', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
  })

  test('case-B swap failure → no unhandled rejection, seek state cleared', async () => {
    mockConsole('error')
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.swapSource.mockRejectedValue(new Error('swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('race: track switched while checking cache → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetCachedUri.mockResolvedValue(CACHED_URI)
    const sourceSwap = createSourceSwap()

    await swapPartialForCachedSeek(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })

  test('partial source + online + not cached + playing → network swap then play', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(AUDIO_URL, 60000)
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + online + not cached + paused → network swap, no play', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.swapSource).toHaveBeenCalledWith(AUDIO_URL, 60000)
    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('case-C swap failure → no unhandled rejection, seek state cleared', async () => {
    mockConsole('error')
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.swapSource.mockRejectedValue(new Error('network swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('race: track switched while checking cache (case C) → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetCurrentSourceUri.mockReturnValue(PARTIAL_URI)
    const sourceSwap = createSourceSwap()

    await swapPartialForNetworkSeek(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.swapSource).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })
})
