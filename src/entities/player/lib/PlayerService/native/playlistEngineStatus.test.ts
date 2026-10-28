import { type AudioPlaylist } from 'expo-audio'
import { readPlaylistStatus } from './playlistEngineStatus'

interface PlaylistStub {
  currentStatus?: unknown
  currentTime?: number
  duration?: number
  isBuffering?: boolean
  isLoaded?: boolean
  playbackRate?: number
  playing?: boolean
  volume?: number
}

const createPlaylist = (stub: PlaylistStub): AudioPlaylist => stub as unknown as AudioPlaylist

describe('readPlaylistStatus', () => {
  test('reports the native auto-advance counter and finish flag for a loaded queue', () => {
    const playlist = createPlaylist({
      currentStatus: { autoAdvanceCount: 4, didJustFinish: false },
      currentTime: 42,
      duration: 120,
      isBuffering: false,
      isLoaded: true,
      playbackRate: 1,
      playing: true,
      volume: 1,
    })

    expect(readPlaylistStatus(playlist)).toEqual({
      autoAdvanceCount: 4,
      didJustFinish: false,
      durationMs: 120_000,
      isBuffering: false,
      isLoaded: true,
      isPlaying: true,
      playbackRate: 1,
      positionMs: 42_000,
      volume: 1,
    })
  })

  test('synthesises the Android ENDED status from the native map', () => {
    const playlist = createPlaylist({
      currentStatus: {
        autoAdvanceCount: 3,
        currentTime: 5,
        didJustFinish: true,
        duration: 120,
        isLoaded: true,
        playing: false,
      },
      isLoaded: false,
    })

    expect(readPlaylistStatus(playlist)).toEqual({
      autoAdvanceCount: 3,
      didJustFinish: true,
      durationMs: 120_000,
      isBuffering: false,
      isLoaded: true,
      isPlaying: false,
      playbackRate: 1,
      positionMs: 5_000,
      volume: 1,
    })
  })

  test('keeps the idle status when the native map is not ended', () => {
    const playlist = createPlaylist({
      currentStatus: { autoAdvanceCount: 2, isLoaded: false, playing: false },
      isLoaded: false,
    })

    expect(readPlaylistStatus(playlist)).toEqual({
      autoAdvanceCount: 2,
      didJustFinish: false,
      durationMs: 0,
      isBuffering: false,
      isLoaded: false,
      isPlaying: false,
      playbackRate: 1,
      positionMs: 0,
      volume: 1,
    })
  })

  test('returns a null counter for legacy binaries without it in the map', () => {
    const playlist = createPlaylist({
      currentStatus: {},
      currentTime: 1,
      duration: 10,
      isLoaded: true,
      playing: false,
      volume: 1,
    })

    expect(readPlaylistStatus(playlist).autoAdvanceCount).toBeNull()
  })

  test('returns the idle status without a playlist', () => {
    expect(readPlaylistStatus(null).isLoaded).toBe(false)
  })
})
