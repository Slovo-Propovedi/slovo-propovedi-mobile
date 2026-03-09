import { useAction, useAtom } from '@reatom/npm-react'
import {
  schedulePushNotification,
  setCurrentSound as setCurrentSoundAction,
  usePlayer,
} from 'entities/player'
import { setPlayerFullscreen } from 'shared/model'
import type { PlaylistData, SermonData } from 'shared/types'
import {
  currentAudioAtom,
  setCurrentAudio as setCurrentAudioAction,
  setCurrentPlaylist as setCurrentPlaylistAction,
} from '../model'

export const usePlayNewSermon = () => {
  const { play, recreateSound } = usePlayer()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const setCurrentSound = useAction(setCurrentSoundAction)
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

    let newSound

    if (currentAudio?.id !== id) newSound = await recreateSound(newAudio.audioUrl)

    if (newSound) void setCurrentSound(newSound)

    await play(newSound)
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: playlist.title,
      title: newAudio.title,
    })
  }
}
