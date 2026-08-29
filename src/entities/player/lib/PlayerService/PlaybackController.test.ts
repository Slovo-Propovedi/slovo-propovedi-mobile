import { type AudioPlayer } from 'expo-audio'
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
