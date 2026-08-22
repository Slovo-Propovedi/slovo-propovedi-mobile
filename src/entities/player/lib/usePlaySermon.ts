import { useAction } from '@reatom/npm-react'
import {
  getEntrySermon,
  getResumePosition,
  historyAtom,
  recordPlaybackStartAction,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { type PlaylistData, type SermonData, setPlayerFullscreen } from 'shared/model'
import {
  currentAudioAtom,
  durationAtom,
  positionAtom,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
} from '../model'
import { type AudioPlayerData } from '../ui/PlayerControls/PlayerControls.types'
import { usePlayer } from './usePlayer'

const SAME_SERMON_TOLERANCE_MS = 1000

export const usePlayNewSermon = () => {
  const { play, replaceAudio, seekTo, setLockScreenMetadata } = usePlayer()

  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const openPlayerFullscreen = useAction(setPlayerFullscreen)
  const recordPlaybackStart = useAction(recordPlaybackStartAction)
  const recordSermonSwitch = useAction(recordSermonSwitchAction)

  interface PlayNewSermonProps {
    playlist: PlaylistData
    sermon: SermonData
  }

  return async ({
    playlist,
    sermon: { artist, audioUrl, id, title, ...other },
  }: PlayNewSermonProps) => {
    if (!audioUrl) return

    const sermonId = id
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

    await setCurrentAudio(newAudio)
    await setCurrentPlaylist(playlist)

    void openPlayerFullscreen(true)

    if (oldAudio?.id && oldAudio.id !== sermonId)
      await recordSermonSwitch({
        markOldCompleted: false,
        newAudio,
        newPlaylist: playlist,
        oldDurationMs,
        oldPositionMs: Math.max(0, oldPositionMs),
        oldSermonId: oldAudio.id,
      })

    if (currentAudio?.id !== sermonId) await replaceAudio(newAudio.audioUrl, resumeMs)
    else {
      const entry = history.find(e => getEntrySermon(e)?.id === sermonId)

      if (entry && resumeMs === 0) await seekTo(0)
      else if (resumeMs > 0 && Math.abs(currentPosition - resumeMs) > SAME_SERMON_TOLERANCE_MS)
        await seekTo(resumeMs)
    }

    if (!oldAudio?.id || oldAudio.id === sermonId) void recordPlaybackStart(newAudio, playlist)

    await play()

    setLockScreenMetadata({
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })
  }
}
