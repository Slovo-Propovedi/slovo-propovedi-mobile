import { type AudioPlaylist, type AudioPlaylistLoopMode, createAudioPlaylist } from 'expo-audio'
import { PART_SUFFIX } from 'entities/offline-cache/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { reportError } from 'shared/model/error-dialog'
import { awaitPlaylistLoaded } from './awaitPlaylistLoaded'
import { lockScreenControls } from './LockScreenControls'
import { applyPartialDuration } from './partialDuration'
import { destroyPlaylistNative, seekPlaylist, skipPlaylistTo } from './playlistEngineControls'
import { attachPlaylistListeners } from './playlistEngineListeners'
import { type PlaylistEngineState } from './playlistEngineState'
import { releasePlaylist } from './playlistQueueLifecycle'

const UPDATE_INTERVAL_MS = 500

const requireCallbacks = (state: PlaylistEngineState) => {
  if (!state.callbacks) throw new Error('PlaylistEngine callbacks are not configured')
  return state.callbacks
}

/**
 * Builds a fresh playlist, replacing (and clearing lock-screen state of) the old one.
 * @param state - Mutable engine state.
 * @param tracks - Domain track data in queue order.
 * @param sources - Resolved absolute URI per track, same order.
 * @param startIndex - Index of the initially playing track.
 * @param loop - Native loop mode.
 * @param initialPositionMs - Resume position in milliseconds.
 */
export const buildQueue = async (
  state: PlaylistEngineState,
  tracks: AudioPlayerData[],
  sources: string[],
  startIndex: number,
  loop: AudioPlaylistLoopMode,
  initialPositionMs = 0,
): Promise<AudioPlaylist | null> => {
  if (tracks.length === 0 || tracks.length !== sources.length) return null
  const previous = releasePlaylist(state)
  if (previous) {
    lockScreenControls.clear(previous)
    destroyPlaylistNative(previous)
  }

  let playlist: AudioPlaylist
  try {
    playlist = createAudioPlaylist({
      loop,
      sources: sources.map(uri => ({ uri })),
      updateInterval: UPDATE_INTERVAL_MS,
    })
  } catch (error) {
    console.error('[PlaylistEngine] createAudioPlaylist failed:', error)
    reportError(error, 'Ошибка при загрузке аудио')
    return null
  }
  state.playlist = playlist
  state.loop = loop
  state.audioTracks = [...tracks]
  state.sources = [...sources]
  state.currentSourceUri = sources[startIndex] ?? null
  try {
    state.subscriptions = attachPlaylistListeners(
      playlist,
      requireCallbacks(state),
      state.snapshots,
      source => (state.currentSourceUri = source),
      state.sources,
      count => (state.autoAdvanceCount = count),
    )
  } catch (error) {
    console.error('[PlaylistEngine] attachPlaylistListeners failed:', error)
    reportError(error, 'Ошибка при загрузке аудио')
    releasePlaylist(state)
    destroyPlaylistNative(playlist)
    return null
  }
  skipPlaylistTo(playlist, startIndex)

  const loaded = await awaitPlaylistLoaded(playlist, () => state.playlist === playlist)
  if (!loaded) return null
  if (initialPositionMs > 0) {
    const durationMs = Math.floor(playlist.duration * 1000)
    const targetMs = durationMs > 0 ? Math.min(initialPositionMs, durationMs) : initialPositionMs
    await seekPlaylist(playlist, targetMs / 1000)
  }
  return playlist
}

/**
 * Rebinds the current queue index to another resolved source without recreating
 * the playlist (keeps the media session / foreground service). Falls back to a
 * one-track rebuild when the native insert/remove pair fails.
 * @param state - Mutable engine state.
 * @param source - Absolute resolved URI (cached file, partial or network).
 * @param positionMs - Target position; omitted means keep the current one.
 */
export const swapCurrentSource = async (
  state: PlaylistEngineState,
  source: string,
  positionMs?: number,
): Promise<boolean> => {
  const playlist = state.playlist
  if (!playlist) return false
  const index = playlist.currentIndex
  const track = state.audioTracks[index]
  const loop = state.loop
  const targetMs = positionMs ?? Math.floor(playlist.currentTime * 1000)

  try {
    playlist.insert({ uri: source }, index)
    playlist.remove(index + 1)
    state.currentSourceUri = source
    await playlist.seekTo(targetMs / 1000)
    if (source.endsWith(PART_SUFFIX)) applyPartialDuration()
    return true
  } catch (error) {
    console.error('[PlaylistEngine] swapCurrentSource failed:', error)
    reportError(error, 'Ошибка при замене аудио')
    if (track) await buildQueue(state, [track], [source], 0, loop, targetMs)
    return false
  }
}
