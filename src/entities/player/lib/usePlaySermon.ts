import { useAction, useAtom } from '@reatom/npm-react'
import {
  getResumePosition,
  historyAtom,
  recordPlaybackStartAction,
} from 'entities/listening-history'
import { type PlaylistData, type SermonData, setPlayerFullscreen } from 'shared/model'
import {
  currentAudioAtom,
  positionAtom,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
} from '../model'
import { type AudioPlayerData } from '../ui/PlayerControls/PlayerControls.types'
import { usePlayer } from './usePlayer'

const SAME_SERMON_TOLERANCE_MS = 1000

export const usePlayNewSermon = () => {
  const { play, replaceAudio, seekTo, setLockScreenMetadata } = usePlayer()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const currentPosition = useAtom(positionAtom)[0]
  const history = useAtom(historyAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const openPlayerFullscreen = useAction(setPlayerFullscreen)
  const recordPlaybackStart = useAction(recordPlaybackStartAction)

  interface PlayNewSermonProps {
    playlist: PlaylistData
    sermon: SermonData
  }

  return async ({
    playlist,
    sermon: { artist, audioUrl, id, title, ...other },
  }: PlayNewSermonProps) => {
    if (!audioUrl) return

    const sermonId = id ?? ''
    const resumeMs = getResumePosition(history, sermonId)

    const newAudio: AudioPlayerData = {
      ...other,
      artist: artist ?? '',
      artwork: playlist.artwork ?? '',
      audioUrl,
      id: sermonId,
      title: title ?? '',
    }

    await setCurrentAudio(newAudio)
    await setCurrentPlaylist(playlist)

    void openPlayerFullscreen(true)

    if (currentAudio?.id !== sermonId) await replaceAudio(newAudio.audioUrl, resumeMs)
    else {
      const entry = history.find(e => e.sermon.id === sermonId)

      if (entry && resumeMs === 0) await seekTo(0)
      else if (resumeMs > 0 && Math.abs(currentPosition - resumeMs) > SAME_SERMON_TOLERANCE_MS)
        await seekTo(resumeMs)
    }

    void recordPlaybackStart(newAudio, playlist)

    await play()

    setLockScreenMetadata({
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })
  }
}
