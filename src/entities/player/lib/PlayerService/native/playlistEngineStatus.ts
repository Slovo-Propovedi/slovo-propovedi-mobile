import { type AudioPlaylist } from 'expo-audio'
import { type PlaylistEngineStatus } from './playlistEngineTypes'

const IDLE_STATUS: PlaylistEngineStatus = {
  autoAdvanceCount: null,
  didJustFinish: false,
  durationMs: 0,
  isBuffering: false,
  isLoaded: false,
  isPlaying: false,
  playbackRate: 1,
  positionMs: 0,
  volume: 1,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readNativeStatus = (playlist: AudioPlaylist): null | Record<string, unknown> => {
  try {
    const status: unknown = playlist.currentStatus
    return isRecord(status) ? status : null
  } catch (error) {
    console.warn('[PlaylistEngine] currentStatus probe failed:', error)
    return null
  }
}

const readNumber = (value: unknown): null | number =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const readAutoAdvanceCount = (status: null | Record<string, unknown>): null | number =>
  readNumber(status?.autoAdvanceCount)

/**
 * Android reports `isLoaded === false` at STATE_ENDED, so the JS property hides
 * a genuinely finished queue. The native map still reports the ended state;
 * synthesising it keeps queue-end completion reachable on foreground reconcile.
 * @param status - Native currentStatus map.
 */
const isEndedNativeStatus = (status: null | Record<string, unknown>): boolean =>
  status !== null &&
  status.isLoaded === true &&
  status.playing === false &&
  status.didJustFinish === true

/**
 * Projects the native playlist instance into the domain status shape used by
 * PlayerService.getStatus (milliseconds, isPlaying).
 * @param playlist - Native playlist instance (null before the first build).
 */
export const readPlaylistStatus = (playlist: AudioPlaylist | null): PlaylistEngineStatus => {
  if (!playlist) return IDLE_STATUS

  const nativeStatus = readNativeStatus(playlist)
  const autoAdvanceCount = readAutoAdvanceCount(nativeStatus)

  if (!playlist.isLoaded) {
    if (!isEndedNativeStatus(nativeStatus)) return { ...IDLE_STATUS, autoAdvanceCount }

    const durationSeconds = readNumber(nativeStatus?.duration)
    const positionSeconds = readNumber(nativeStatus?.currentTime)
    return {
      ...IDLE_STATUS,
      autoAdvanceCount,
      didJustFinish: true,
      durationMs: Math.floor((durationSeconds ?? 0) * 1000),
      isLoaded: true,
      positionMs: Math.floor((positionSeconds ?? 0) * 1000),
    }
  }

  return {
    autoAdvanceCount,
    didJustFinish: nativeStatus?.didJustFinish === true,
    durationMs: Math.floor(playlist.duration * 1000),
    isBuffering: playlist.isBuffering,
    isLoaded: playlist.isLoaded,
    isPlaying: playlist.playing,
    playbackRate: playlist.playbackRate,
    positionMs: Math.floor(playlist.currentTime * 1000),
    volume: playlist.volume,
  }
}
