import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData, type SermonData } from 'entities/sermon/@x/player'
import { type LockScreenMetadata } from './PlayerService/types'

export interface PlayNewSermonDeps {
  clearSuppressionOnError: (sermonId: string) => void
  isOnline: boolean
  isRepeatTapSuppressed: (sermonId: string) => boolean
  markPlayFinished: (sermonId: string) => void
  markPlayStarted: (sermonId: string) => void
  play: () => Promise<unknown>
  reassertLockScreenMetadata: (metadata: LockScreenMetadata) => void
  recordPlaybackStart: (audio: AudioPlayerData, playlist: PlaylistData) => Promise<unknown>
  recordSermonSwitch: (params: {
    markOldCompleted: boolean
    newAudio: AudioPlayerData
    newPlaylist: PlaylistData
    oldDurationMs: number
    oldPositionMs: number
    oldSermonId: string
  }) => Promise<unknown>
  replaceAudio: (url: string, positionMs: number) => Promise<unknown>
  resumeAfterPause: (audioUrl: string) => Promise<unknown>
  seekTo: (ms: number) => Promise<unknown>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setCurrentPlaylist: (playlist: PlaylistData) => Promise<unknown>
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
}

export interface PlayNewSermonProps {
  playlist: PlaylistData
  sermon: SermonData
}
