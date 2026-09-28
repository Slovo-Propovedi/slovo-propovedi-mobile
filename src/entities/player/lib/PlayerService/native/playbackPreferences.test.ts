import { type AudioPlayer } from 'expo-audio'
import { playbackPreferences } from './playbackPreferences'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('../../../model', () => ({
  applyVolumeAction: jest.fn(),
  setVolumeAction: jest.fn(),
}))

jest.mock('../../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

const { applyVolumeAction, setVolumeAction } = jest.requireMock('../../../model') as {
  applyVolumeAction: jest.Mock
  setVolumeAction: jest.Mock
}

const createPlayerStub = (loaded: boolean): AudioPlayer =>
  ({ isLoaded: loaded, setPlaybackRate: jest.fn(), volume: 1 }) as unknown as AudioPlayer

beforeEach(() => {
  jest.clearAllMocks()
  playbackPreferences.setVolume(createPlayerStub(true), 1)
  playbackPreferences.setPlaybackRate(createPlayerStub(true), 1)
})

describe('PlaybackPreferences volume', () => {
  test('setVolume stores the volume when there is no player instance yet', () => {
    playbackPreferences.setVolume(null, 0.4)

    expect(playbackPreferences.getVolume()).toBe(0.4)
  })

  test('setVolume clamps out-of-range values', () => {
    playbackPreferences.setVolume(null, 2)
    expect(playbackPreferences.getVolume()).toBe(1)

    playbackPreferences.setVolume(null, -1)
    expect(playbackPreferences.getVolume()).toBe(0)
  })

  test('applyVolume applies live without persisting', () => {
    const player = createPlayerStub(true)
    setVolumeAction.mockClear()

    playbackPreferences.applyVolume(player, 0.3)

    expect(player.volume).toBe(0.3)
    expect(playbackPreferences.getVolume()).toBe(0.3)
    expect(applyVolumeAction).toHaveBeenLastCalledWith(expect.anything(), 0.3)
    expect(setVolumeAction).not.toHaveBeenCalled()
  })

  test('reassertVolume re-applies the stored volume to a fresh loaded player', () => {
    playbackPreferences.setVolume(null, 0.4)
    const player = createPlayerStub(true)

    playbackPreferences.reassertVolume(player)

    expect(player.volume).toBe(0.4)
  })

  test('reassertVolume does not touch an unloaded player', () => {
    playbackPreferences.setVolume(null, 0.4)
    const player = createPlayerStub(false)

    playbackPreferences.reassertVolume(player)

    expect(player.volume).toBe(1)
  })

  test('reassertVolume early-exits when the stored volume is the default', () => {
    const player = createPlayerStub(true)
    player.volume = 0.7

    playbackPreferences.reassertVolume(player)

    expect(player.volume).toBe(0.7)
  })

  test('setVolume applies the volume to a loaded player and persists', () => {
    const player = createPlayerStub(true)

    playbackPreferences.setVolume(player, 0.5)

    expect(player.volume).toBe(0.5)
    expect(setVolumeAction).toHaveBeenLastCalledWith(expect.anything(), 0.5)
  })
})

describe('PlaybackPreferences rate', () => {
  test('setPlaybackRate stores the rate when there is no player instance yet', () => {
    playbackPreferences.setPlaybackRate(null, 1.5)

    expect(playbackPreferences.getPlaybackRate()).toBe(1.5)
  })

  test('applyPlaybackRate re-applies the stored rate to a fresh loaded player', () => {
    playbackPreferences.setPlaybackRate(null, 1.5)
    const player = createPlayerStub(true)

    playbackPreferences.applyPlaybackRate(player)

    expect(player.setPlaybackRate).toHaveBeenCalledWith(1.5, 'high')
  })

  test('applyPlaybackRate does not touch an unloaded player', () => {
    playbackPreferences.setPlaybackRate(null, 1.5)
    const player = createPlayerStub(false)

    playbackPreferences.applyPlaybackRate(player)

    expect(player.setPlaybackRate).not.toHaveBeenCalled()
  })
})
