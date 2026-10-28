import { type AudioPlaylist, type AudioPlaylistLoopMode } from 'expo-audio'
import { PART_SUFFIX } from 'entities/offline-cache/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import {
  seekPlaylist,
  setPlaylistLoop,
  skipPlaylistTo,
  withPlaylist,
} from './playlistEngineControls'
import { createPlaylistEngineState } from './playlistEngineState'
import { readPlaylistStatus } from './playlistEngineStatus'
import {
  type PlaylistEngineCallbacks,
  type PlaylistEngineStatus,
  type TrackSnapshot,
} from './playlistEngineTypes'
import { destroyQueue } from './playlistQueueLifecycle'
import { buildQueue, swapCurrentSource } from './playlistQueueOperations'

/**
 * Owns the single native expo-audio AudioPlaylist that backs continuous
 * playback. Native auto-advance keeps playing through a frozen JS process;
 * JS only observes trackChanged and reconciles history/metadata.
 */
class PlaylistEngine {
  public setCallbacks = (callbacks: PlaylistEngineCallbacks): void => {
    this.state.callbacks = callbacks
  }

  public buildQueue = (
    tracks: AudioPlayerData[],
    sources: string[],
    startIndex: number,
    loop: AudioPlaylistLoopMode,
    initialPositionMs = 0,
  ): Promise<AudioPlaylist | null> =>
    buildQueue(this.state, tracks, sources, startIndex, loop, initialPositionMs)

  public swapCurrentSource = (source: string, positionMs?: number): Promise<boolean> =>
    swapCurrentSource(this.state, source, positionMs)

  public setLoopMode = (loop: AudioPlaylistLoopMode): void => setPlaylistLoop(this.state, loop)

  public skipToIndex = (index: number): void => skipPlaylistTo(this.state.playlist, index)

  public seekTo = (seconds: number): Promise<void> => seekPlaylist(this.state.playlist, seconds)

  public play = (): void => withPlaylist(this.state.playlist, playlist => playlist.play())

  public pause = (): void => withPlaylist(this.state.playlist, playlist => playlist.pause())

  public destroy = (): void => destroyQueue(this.state)

  public getPlaylist = (): AudioPlaylist | null => this.state.playlist

  public getStatus = (): PlaylistEngineStatus => readPlaylistStatus(this.state.playlist)

  public getTrackAt = (index: number): AudioPlayerData | null =>
    this.state.audioTracks[index] ?? null

  public getTrackCount = (): number => this.state.audioTracks.length

  public getCurrentIndex = (): number => this.state.playlist?.currentIndex ?? -1

  public getLoop = (): AudioPlaylistLoopMode => this.state.loop

  public getAutoAdvanceCount = (): null | number => this.state.autoAdvanceCount

  public getCurrentSourceUri = (): null | string => this.state.currentSourceUri

  public getSnapshot = (index: number): null | TrackSnapshot =>
    this.state.snapshots.get(index) ?? null

  public isCurrentSourcePartial = (): boolean =>
    this.state.currentSourceUri?.endsWith(PART_SUFFIX) ?? false

  public isLoaded = (): boolean => this.state.playlist?.isLoaded ?? false

  private state = createPlaylistEngineState()
}

export const playlistEngine = new PlaylistEngine()
