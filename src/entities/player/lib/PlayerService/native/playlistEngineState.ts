import { type AudioPlaylist, type AudioPlaylistLoopMode } from 'expo-audio'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { type PlaylistSubscriptions } from './playlistEngineListeners'
import { type PlaylistEngineCallbacks, type TrackSnapshot } from './playlistEngineTypes'

export interface PlaylistEngineState {
  audioTracks: AudioPlayerData[]
  // Cumulative native auto-advance counter at the last received event; null
  // until a patched binary reports one (legacy binaries stay null).
  autoAdvanceCount: null | number
  callbacks: null | PlaylistEngineCallbacks
  currentSourceUri: null | string
  // The native `playlist.loop` getter is the only thread-unsafe AudioPlaylist
  // member (reads ExoPlayer's repeatMode off the JS thread), so the engine keeps
  // its own copy instead of reading it back.
  loop: AudioPlaylistLoopMode
  playlist: AudioPlaylist | null
  snapshots: Map<number, TrackSnapshot>
  sources: string[]
  subscriptions: PlaylistSubscriptions
}

export const createPlaylistEngineState = (): PlaylistEngineState => ({
  audioTracks: [],
  autoAdvanceCount: null,
  callbacks: null,
  currentSourceUri: null,
  loop: 'none',
  playlist: null,
  snapshots: new Map(),
  sources: [],
  subscriptions: { status: null, track: null },
})
