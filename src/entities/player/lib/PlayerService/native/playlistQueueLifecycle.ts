import { type AudioPlaylist } from 'expo-audio'
import { destroyPlaylistNative } from './playlistEngineControls'
import { type PlaylistEngineState } from './playlistEngineState'

/**
 * Detaches listeners and forgets the current playlist. Native teardown is the
 * caller's responsibility so build (which clears lock-screen state) and unload
 * (which must not, issue #50) stay distinguishable.
 * @param state - Mutable engine state.
 * @returns The detached native playlist, if any.
 */
export const releasePlaylist = (state: PlaylistEngineState): AudioPlaylist | null => {
  const playlist = state.playlist
  state.subscriptions.status?.remove()
  state.subscriptions.track?.remove()
  state.subscriptions = { status: null, track: null }
  state.playlist = null
  state.audioTracks = []
  state.sources = []
  state.snapshots.clear()
  state.currentSourceUri = null
  state.autoAdvanceCount = null
  return playlist
}

/**
 * Full teardown for unload: no lock-screen clear (issue #50).
 * @param state - Mutable engine state.
 */
export const destroyQueue = (state: PlaylistEngineState): void => {
  destroyPlaylistNative(releasePlaylist(state))
}
