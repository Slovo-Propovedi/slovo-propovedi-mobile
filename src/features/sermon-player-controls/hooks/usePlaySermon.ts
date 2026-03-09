import { useNavigation } from '@react-navigation/native'
import { useAction, useAtom } from '@reatom/npm-react'
import {
  schedulePushNotification,
  setCurrentSound as setCurrentSoundAction,
  usePlayer,
} from 'entities/player'
import { ListenStackParamName } from 'shared/routing'
import type { ListenStackNavProp } from 'shared/routing'
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

  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>()

  interface PlayNewSermonProps {
    playlist: PlaylistData
    sermon: SermonData
  }

  return async ({ playlist, sermon: { audioUrl, id, ...other } }: PlayNewSermonProps) => {
    if (!audioUrl) return

    const newAudio = { ...other, audioUrl, id, previewUrl: playlist.previewUrl }

    await setCurrentAudio(newAudio)
    await setCurrentPlaylist(playlist)

    navigate(ListenStackParamName.AudioPlayer)

    let newSound

    if (currentAudio?.id !== id) newSound = await recreateSound(newAudio.audioUrl)

    if (newSound) setCurrentSound(newSound)

    await play(newSound)
    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: playlist.title,
      title: newAudio.title,
    })
  }
}
