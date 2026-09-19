import { type AudioPlayer } from 'expo-audio'
import { audioCacheService, getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import {
  currentAudioAtom,
  isPlayingAtom,
  isSeekingAtom,
  seekTargetPositionAtom,
} from '../../../model'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { audioLoader } from './AudioLoader'
import { playbackController } from './PlaybackController'
import { seekViaPartialSource, swapPartialForCachedSeek } from './seekViaPartialSource'
import { swapPartialForNetworkSeek } from './swapPartialForNetworkSeek'

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
  getPartialFileUri: jest.fn(),
  PART_SUFFIX: '.cache.mp3',
}))

jest.mock('./AudioLoader', () => ({
  audioLoader: { getLastResolvedUrl: jest.fn() },
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

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Test Sermon',
}

const mockedGetLastResolvedUrl = jest.mocked(audioLoader.getLastResolvedUrl)
const mockedGetPartialFileUri = jest.mocked(getPartialFileUri)
const mockedIsCached = jest.mocked(audioCacheService.isCached)

const createPlayerStub = (): AudioPlayer =>
  ({ isLoaded: true, seekTo: jest.fn().mockResolvedValue(undefined) }) as unknown as AudioPlayer

const createSourceSwap = () => {
  const play = jest.fn().mockResolvedValue(undefined)
  const replaceAudio = jest.fn().mockResolvedValue(undefined)
  return { play, replaceAudio }
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
    mockedGetLastResolvedUrl.mockReturnValue(AUDIO_URL)
    mockedGetPartialFileUri.mockResolvedValue(null)
    mockedIsCached.mockResolvedValue(false)
  })

  test('offline + network source + partial + playing → replaceAudio then play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
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

  test('offline + network source + partial + stall-paused → replaceAudio then play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    setIsStalledOfflineAction(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('offline + network source + partial + manually paused → replaceAudio, no play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
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
    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
  })

  test('offline + already file:// source → normal seek path', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
  })

  test('offline + network source but no partial on disk → normal seek path', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetPartialFileUri.mockResolvedValue(null)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
  })

  test('race: track switched while resolving partial → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    const sourceSwap = createSourceSwap()

    await seekViaPartialSource(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })

  test('swap failure → no unhandled rejection, seek state cleared', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.replaceAudio.mockRejectedValue(new Error('swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('partial source + full cached + playing → replaceAudio then play, no native seek', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + full cached + paused → replaceAudio, no play, no native seek', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + full not cached + offline → normal seek path, no source swap', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(player.seekTo).toHaveBeenCalledWith(60)
    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
  })

  test('case-B swap failure → no unhandled rejection, seek state cleared', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(true)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.replaceAudio.mockRejectedValue(new Error('swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('race: track switched while checking cache → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    const sourceSwap = createSourceSwap()

    await swapPartialForCachedSeek(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })

  test('partial source + online + not cached + playing → replaceAudio then play, no native seek', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('partial source + online + not cached + paused → replaceAudio, no play, no native seek', async () => {
    currentAudioAtom(ctx, mockAudio)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000, {
      preserveSeekGuard: true,
    })
    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('case-C swap failure → no unhandled rejection, seek state cleared', async () => {
    currentAudioAtom(ctx, mockAudio)
    isPlayingAtom(ctx, true)
    mockedGetLastResolvedUrl.mockReturnValue(PARTIAL_URI)
    mockedIsCached.mockResolvedValue(false)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()
    sourceSwap.replaceAudio.mockRejectedValue(new Error('network swap failed'))

    await expect(playbackController.seekTo(player, 60000, sourceSwap)).resolves.toBeUndefined()

    expect(sourceSwap.play).not.toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })

  test('race: track switched while checking cache (case C) → no source swap', async () => {
    currentAudioAtom(ctx, mockAudio)
    const sourceSwap = createSourceSwap()

    await swapPartialForNetworkSeek(sourceSwap, OTHER_URL, 60000)

    expect(sourceSwap.replaceAudio).not.toHaveBeenCalled()
    expect(sourceSwap.play).not.toHaveBeenCalled()
  })
})
