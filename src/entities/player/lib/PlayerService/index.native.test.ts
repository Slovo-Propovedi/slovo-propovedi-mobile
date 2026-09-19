import { type AudioPlayer } from 'expo-audio'
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
import { playerService } from './index.native'
import { audioLoader } from './native/AudioLoader'
import { lockScreenControls } from './native/LockScreenControls'
import { playbackController } from './native/PlaybackController'
import { playerStatusListener } from './native/PlayerStatusListener'

jest.mock('./native/AudioLoader', () => ({
  audioLoader: {
    getLastResolvedUrl: jest.fn(),
    isPlayerLoaded: jest.fn(),
    loadAudio: jest.fn(),
    replaceAudio: jest.fn(),
  },
}))

jest.mock('./native/AudioModeManager', () => ({ audioModeManager: { configure: jest.fn() } }))

jest.mock('./native/LockScreenControls', () => ({
  lockScreenControls: { reassertMetadata: jest.fn() },
}))

jest.mock('./native/nativePlayerHelpers', () => ({
  createAudioInterruptionHandler: jest.fn(() => jest.fn()),
  setupPlayerListeners: jest.fn(),
}))

jest.mock('./native/PlayerStatusListener', () => ({ playerStatusListener: { cleanup: jest.fn() } }))

jest.mock('./native/TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: { setPlayerActions: jest.fn() },
}))

const createPlayerStub = (): AudioPlayer => ({ isLoaded: true }) as unknown as AudioPlayer

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('PlayerService.replaceAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isSeekingAtom(ctx, false)
    seekTargetPositionAtom(ctx, null)
  })

  test('resets the seek guard so the new track position events are not ignored', async () => {
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)
    ;(audioLoader.replaceAudio as jest.Mock).mockResolvedValue(createPlayerStub())

    await playerService.replaceAudio('https://example.com/next.mp3')
    await flushMicrotasks()

    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })
})

describe('PlayerService.stop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('detaches the status listener before pausing (no post-stop interruption flush)', async () => {
    const cleanupSpy = jest.mocked(playerStatusListener.cleanup)
    const stopSpy = jest.spyOn(playbackController, 'stop').mockResolvedValue(undefined)

    await playerService.stop()

    expect(cleanupSpy).toHaveBeenCalled()
    expect(stopSpy).toHaveBeenCalled()
    expect(cleanupSpy.mock.invocationCallOrder[0]).toBeLessThan(stopSpy.mock.invocationCallOrder[0])
  })
})

describe('PlayerService volume restore', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await playerService.setVolume(1)
  })

  test('applies the restored volume to a fresh player after loadAudio', async () => {
    const player = createPlayerStub()
    ;(audioLoader.loadAudio as jest.Mock).mockResolvedValue(player)

    await playerService.setVolume(0.4)
    await playerService.loadAudio('https://example.com/audio.mp3')

    expect(player.volume).toBe(0.4)
  })

  test('re-applies the stored volume after replaceAudio', async () => {
    const player = createPlayerStub()
    ;(audioLoader.replaceAudio as jest.Mock).mockResolvedValue(player)

    await playerService.setVolume(0.4)
    await playerService.replaceAudio('https://example.com/next.mp3')

    expect(player.volume).toBe(0.4)
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
    ;(audioLoader.getLastResolvedUrl as jest.Mock).mockReturnValue(NETWORK_URL)
    ;(audioLoader.isPlayerLoaded as jest.Mock).mockReturnValue(true)
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
    ;(audioLoader.getLastResolvedUrl as jest.Mock).mockReturnValue('file:///cache/abc.mp3')
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
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalledWith(NETWORK_URL, 1000)
    expect(loadSpy).not.toHaveBeenCalled()
    expect(playSpy).toHaveBeenCalled()
  })

  test('never-loaded player routes through loadAudio', async () => {
    ;(audioLoader.isPlayerLoaded as jest.Mock).mockReturnValue(false)
    positionAtom(ctx, 5000)
    const replaceSpy = jest.spyOn(playerService, 'replaceAudio').mockResolvedValue(null)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(null)
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(loadSpy).toHaveBeenCalledWith(NETWORK_URL, 5000)
    expect(replaceSpy).not.toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
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
      .mockResolvedValue(createPlayerStub())
    const playSpy = jest.spyOn(playerService, 'play').mockResolvedValue(undefined)

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).toHaveBeenCalled()
    expect(playSpy).not.toHaveBeenCalled()
    expect(reassertMetadataSpy).toHaveBeenCalledTimes(1)
    expect(reassertMetadataSpy.mock.calls[0][1]).toEqual({
      albumTitle: 'Test Playlist',
      artist: AUDIO_DATA.artist,
      artworkUrl: null,
      title: AUDIO_DATA.title,
    })
    expect(reassertMetadataSpy.mock.invocationCallOrder[0]).toBeGreaterThan(
      replaceSpy.mock.invocationCallOrder[0],
    )
  })

  test('healthy playing stream does not re-assert lock screen metadata', async () => {
    isPlayingAtom(ctx, true)
    isBufferingAtom(ctx, false)
    const replaceSpy = jest
      .spyOn(playerService, 'replaceAudio')
      .mockResolvedValue(createPlayerStub())

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(reassertMetadataSpy).not.toHaveBeenCalled()
  })

  test('local file source does not re-assert lock screen metadata', async () => {
    ;(audioLoader.getLastResolvedUrl as jest.Mock).mockReturnValue('file:///cache/abc.mp3')
    const replaceSpy = jest
      .spyOn(playerService, 'replaceAudio')
      .mockResolvedValue(createPlayerStub())

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(replaceSpy).not.toHaveBeenCalled()
    expect(reassertMetadataSpy).not.toHaveBeenCalled()
  })

  test('loadAudio heal success re-asserts lock screen metadata', async () => {
    ;(audioLoader.isPlayerLoaded as jest.Mock).mockReturnValue(false)
    currentAudioAtom(ctx, AUDIO_DATA)
    const loadSpy = jest.spyOn(playerService, 'loadAudio').mockResolvedValue(createPlayerStub())

    await playerService.recoverStreamAfterReconnect(NETWORK_URL)

    expect(loadSpy).toHaveBeenCalled()
    expect(reassertMetadataSpy).toHaveBeenCalledTimes(1)
    expect(reassertMetadataSpy.mock.calls[0][1]).toEqual({
      artist: AUDIO_DATA.artist,
      artworkUrl: null,
      title: AUDIO_DATA.title,
    })
  })
})
