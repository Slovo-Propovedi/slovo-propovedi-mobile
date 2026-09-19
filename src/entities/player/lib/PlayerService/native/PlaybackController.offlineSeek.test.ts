import { type AudioPlayer } from 'expo-audio'
import { getPartialFileUri } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom, pauseTypeAtom } from '../../../model'
import { audioLoader } from './AudioLoader'
import { playbackController } from './PlaybackController'

jest.mock('shared/lib/audio-cache', () => ({ getPartialFileUri: jest.fn() }))

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
    pauseTypeAtom(ctx, null)
    mockedGetLastResolvedUrl.mockReturnValue(AUDIO_URL)
    mockedGetPartialFileUri.mockResolvedValue(null)
  })

  test('offline + network source + partial + auto pause → replaceAudio then play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    pauseTypeAtom(ctx, 'auto')
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000)
    expect(sourceSwap.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('offline + network source + partial + manual pause → replaceAudio, no play, no native seek', async () => {
    isOnlineAtom(ctx, false)
    currentAudioAtom(ctx, mockAudio)
    pauseTypeAtom(ctx, 'manual')
    mockedGetPartialFileUri.mockResolvedValue(PARTIAL_URI)
    const player = createPlayerStub()
    const sourceSwap = createSourceSwap()

    await playbackController.seekTo(player, 60000, sourceSwap)

    expect(sourceSwap.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 60000)
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
})
