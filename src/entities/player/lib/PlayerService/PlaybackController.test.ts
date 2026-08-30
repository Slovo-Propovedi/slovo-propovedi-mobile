import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, durationAtom } from '../../model'
import { savePlaybackProgress } from '../playbackProgress'
import { playbackController } from './PlaybackController'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('../../model', () => ({
  currentAudioAtom: jest.fn(),
  durationAtom: jest.fn(),
  isSeekingAtom: jest.fn(),
  setIsPlayingAction: jest.fn(),
  setIsSeekingAction: jest.fn(),
  setPositionAction: jest.fn(),
  setSeekTargetAction: jest.fn(),
  setVolumeAction: jest.fn(),
}))

jest.mock('../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

jest.mock('../playbackProgress', () => ({ savePlaybackProgress: jest.fn() }))

jest.mock('entities/listening-history/@x/player', () => ({
  flushHistoryProgressAction: jest.fn(),
}))

const createPlayerStub = (loaded: boolean) => {
  const setPlaybackRate = jest.fn()
  const player = { isLoaded: loaded, setPlaybackRate } as unknown as AudioPlayer
  return { player, setPlaybackRate }
}

beforeEach(() => {
  jest.clearAllMocks()
  const { player } = createPlayerStub(true)
  void playbackController.setPlaybackRate(player, 1)
})

describe('PlaybackController playback rate', () => {
  test('setPlaybackRate on not-loaded player calls native setter and stores rate', async () => {
    const { player, setPlaybackRate } = createPlayerStub(false)

    await playbackController.setPlaybackRate(player, 1.5)

    expect(setPlaybackRate).toHaveBeenCalledWith(1.5, 'high')
    expect(playbackController.getPlaybackRate()).toBe(1.5)
  })

  test('applyPlaybackRate applies stored non-1 rate to a fresh loaded player', async () => {
    await playbackController.setPlaybackRate(createPlayerStub(true).player, 1.5)
    const { player, setPlaybackRate } = createPlayerStub(true)

    playbackController.applyPlaybackRate(player)

    expect(setPlaybackRate).toHaveBeenCalledWith(1.5, 'high')
  })

  test('applyPlaybackRate early-exits when stored rate is 1', () => {
    const { player, setPlaybackRate } = createPlayerStub(true)

    playbackController.applyPlaybackRate(player)

    expect(setPlaybackRate).not.toHaveBeenCalled()
  })

  test('setPlaybackRate on not-loaded player then applyPlaybackRate on fresh loaded player applies rate', async () => {
    const { player: notLoadedPlayer, setPlaybackRate: setRateOnNotLoaded } = createPlayerStub(false)

    await playbackController.setPlaybackRate(notLoadedPlayer, 1.5)

    expect(setRateOnNotLoaded).toHaveBeenCalledWith(1.5, 'high')
    expect(playbackController.getPlaybackRate()).toBe(1.5)

    const { player: freshPlayer, setPlaybackRate: setRateOnFresh } = createPlayerStub(true)
    playbackController.applyPlaybackRate(freshPlayer)

    expect(setRateOnFresh).toHaveBeenCalledWith(1.5, 'high')
  })
})

describe('PlaybackController stop flush', () => {
  test('stop() flushes the pre-stop position', async () => {
    ;(ctx.get as jest.Mock).mockImplementation(atom => {
      if (atom === currentAudioAtom) return { id: 'sermon-1' }
      if (atom === durationAtom) return 100000
      return undefined
    })
    const player = {
      currentTime: 42,
      isLoaded: true,
      pause: jest.fn(),
      seekTo: jest.fn().mockResolvedValue(undefined),
    } as unknown as AudioPlayer

    await playbackController.stop(player)

    expect(savePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 42000 }),
    )
  })

  test('stop() still flushes the pre-stop position when seekTo(0) rejects', async () => {
    ;(ctx.get as jest.Mock).mockImplementation(atom => {
      if (atom === currentAudioAtom) return { id: 'sermon-1' }
      if (atom === durationAtom) return 100000
      return undefined
    })
    const player = {
      currentTime: 42,
      isLoaded: true,
      pause: jest.fn(),
      seekTo: jest.fn().mockRejectedValue(new Error('seek failed')),
    } as unknown as AudioPlayer

    await playbackController.stop(player)

    expect(savePlaybackProgress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ positionMs: 42000 }),
    )
  })
})
