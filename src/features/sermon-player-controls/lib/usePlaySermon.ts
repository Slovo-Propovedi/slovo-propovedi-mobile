import { useAction, useAtom } from '@reatom/npm-react'
import { usePlayer } from 'entities/player'
import { setPlayerFullscreen } from 'shared/model'
import type { PlaylistData, SermonData } from 'shared/model'
import {
  currentAudioAtom,
  setCurrentAudio as setCurrentAudioAction,
  setCurrentPlaylist as setCurrentPlaylistAction,
} from '../model'

export const usePlayNewSermon = () => {
  const { loadAudio, play } = usePlayer()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const openPlayerFullscreen = useAction(setPlayerFullscreen)

  interface PlayNewSermonProps {
    playlist: PlaylistData
    sermon: SermonData
  }

  return async ({ playlist, sermon: { audioUrl, id, ...other } }: PlayNewSermonProps) => {
    if (!audioUrl) return

    const newAudio = { ...other, audioUrl, id, previewUrl: playlist.previewUrl }

    await setCurrentAudio(newAudio)
    await setCurrentPlaylist(playlist)

    void openPlayerFullscreen(true)

    if (currentAudio?.id !== id) await loadAudio(newAudio.audioUrl)

    await play()
  }
}
