import { type AudioPlayer } from 'expo-audio'
import { playbackPreferences } from './playbackPreferences'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('../../model', () => ({ setVolumeAction: jest.fn() }))

jest.mock('../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

const createPlayerStub = (loaded: boolean): AudioPlayer =>
  ({ isLoaded: loaded, volume: 1 }) as unknown as AudioPlayer

beforeEach(() => {
  jest.clearAllMocks()
  playbackPreferences.setVolume(createPlayerStub(true), 1)
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

  test('applyVolume re-applies the stored volume to a fresh loaded player', () => {
    playbackPreferences.setVolume(null, 0.4)
    const player = createPlayerStub(true)

    playbackPreferences.applyVolume(player)

    expect(player.volume).toBe(0.4)
  })

  test('applyVolume does not touch an unloaded player', () => {
    playbackPreferences.setVolume(null, 0.4)
    const player = createPlayerStub(false)

    playbackPreferences.applyVolume(player)

    expect(player.volume).toBe(1)
  })

  test('applyVolume early-exits when the stored volume is the default', () => {
    const player = createPlayerStub(true)
    player.volume = 0.7

    playbackPreferences.applyVolume(player)

    expect(player.volume).toBe(0.7)
  })
})
