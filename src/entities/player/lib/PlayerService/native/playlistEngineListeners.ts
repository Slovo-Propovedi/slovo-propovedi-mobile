import { type AudioPlaylist, type AudioPlaylistStatus } from 'expo-audio'
import { type PlaylistEngineCallbacks, type TrackSnapshot } from './playlistEngineTypes'

export interface PlaylistSubscriptions {
  status: { remove: () => void } | null
  track: { remove: () => void } | null
}

const publishAutoAdvanceCount = (
  payload: { autoAdvanceCount?: number },
  onAutoAdvanceCount: (count: number) => void,
): void => {
  if (typeof payload.autoAdvanceCount === 'number') onAutoAdvanceCount(payload.autoAdvanceCount)
}

/**
 * Attaches the two native playlist event streams. Status events feed the
 * per-index snapshot map (old-track flush on switch) and the atom sync layer;
 * trackChanged flips the engine's current-source tracking before notifying JS.
 * @param playlist - Playlist instance to observe.
 * @param callbacks - Delegated event consumers.
 * @param snapshots - Per-index snapshot map updated on every status event.
 * @param onSourceChange - Receives the incoming track's resolved source URI.
 * @param sources - Resolved source URIs in queue order.
 * @param onAutoAdvanceCount - Receives the native cumulative auto-advance counter.
 */
export const attachPlaylistListeners = (
  playlist: AudioPlaylist,
  callbacks: PlaylistEngineCallbacks,
  snapshots: Map<number, TrackSnapshot>,
  onSourceChange: (source: null | string) => void,
  sources: string[],
  onAutoAdvanceCount: (count: number) => void,
): PlaylistSubscriptions => ({
  status: playlist.addListener('playlistStatusUpdate', (status: AudioPlaylistStatus) => {
    snapshots.set(status.currentIndex, {
      currentTime: status.currentTime,
      duration: status.duration,
    })
    publishAutoAdvanceCount(status, onAutoAdvanceCount)
    callbacks.onStatus(status)
  }),
  track: playlist.addListener('trackChanged', payload => {
    const { currentIndex, previousIndex } = payload
    publishAutoAdvanceCount(payload, onAutoAdvanceCount)
    onSourceChange(sources[currentIndex] ?? null)
    callbacks.onTrackChanged(previousIndex, currentIndex)
  }),
})
