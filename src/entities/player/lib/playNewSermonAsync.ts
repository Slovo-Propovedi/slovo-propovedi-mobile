import {
  getEntrySermon,
  getResumePosition,
  historyAtom,
} from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData, type SermonData } from 'shared/model'
import type { LockScreenMetadata } from './PlayerService/types'
import { currentAudioAtom, durationAtom, positionAtom } from '../model'
import { guardOfflinePlayback } from './playOfflineGuard'

const SAME_SERMON_TOLERANCE_MS = 1000

export interface PlayNewSermonDeps {
  clearSuppressionOnError: (sermonId: string) => void
  isOnline: boolean
  isRepeatTapSuppressed: (sermonId: string) => boolean
  markPlayFinished: (sermonId: string) => void
  markPlayStarted: (sermonId: string) => void
  openPlayerFullscreen: (expanded: boolean) => Promise<unknown>
  play: () => Promise<unknown>
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
  seekTo: (ms: number) => Promise<unknown>
  setCurrentAudio: (audio: AudioPlayerData) => Promise<unknown>
  setCurrentPlaylist: (playlist: PlaylistData) => Promise<unknown>
  setLockScreenMetadata: (metadata: LockScreenMetadata) => void
}

export interface PlayNewSermonProps {
  playlist: PlaylistData
  sermon: SermonData
}

export const playNewSermonAsync = async (
  { playlist, sermon: { artist, audioUrl, id, title, ...other } }: PlayNewSermonProps,
  deps: PlayNewSermonDeps,
) => {
  if (!audioUrl) return

  const sermonId = id

  if (deps.isRepeatTapSuppressed(sermonId)) return

  deps.markPlayStarted(sermonId)

  try {
    if (await guardOfflinePlayback(audioUrl, deps.isOnline)) return
    const currentAudio = ctx.get(currentAudioAtom)
    const currentPosition = ctx.get(positionAtom)
    const currentDuration = ctx.get(durationAtom)
    const history = ctx.get(historyAtom)
    const resumeMs = getResumePosition(history, sermonId)

    const newAudio: AudioPlayerData = {
      ...other,
      artist,
      artwork: playlist.artwork,
      audioUrl,
      id: sermonId,
      title,
    }

    const oldAudio = currentAudio
    const oldPositionMs = currentPosition
    const oldDurationMs = currentDuration

    await deps.setCurrentAudio(newAudio)
    await deps.setCurrentPlaylist(playlist)

    void deps.openPlayerFullscreen(true)

    if (oldAudio?.id && oldAudio.id !== sermonId)
      await deps.recordSermonSwitch({
        markOldCompleted: false,
        newAudio,
        newPlaylist: playlist,
        oldDurationMs,
        oldPositionMs: Math.max(0, oldPositionMs),
        oldSermonId: oldAudio.id,
      })

    if (currentAudio?.id !== sermonId) await deps.replaceAudio(newAudio.audioUrl, resumeMs)
    else {
      const entry = history.find(e => getEntrySermon(e)?.id === sermonId)

      if (entry && resumeMs === 0) await deps.seekTo(0)
      else if (resumeMs > 0 && Math.abs(currentPosition - resumeMs) > SAME_SERMON_TOLERANCE_MS)
        await deps.seekTo(resumeMs)
    }

    if (!oldAudio?.id || oldAudio.id === sermonId) void deps.recordPlaybackStart(newAudio, playlist)

    await deps.play()

    deps.setLockScreenMetadata({
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })
  } catch (error) {
    deps.clearSuppressionOnError(sermonId)
    throw error
  } finally {
    deps.markPlayFinished(sermonId)
  }
}
