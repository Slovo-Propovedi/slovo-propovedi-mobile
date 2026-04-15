import { useAction, useAtom } from '@reatom/npm-react'
import { type PlaylistData, type SermonData, setPlayerFullscreen } from 'shared/model'
import { currentAudioAtom, setCurrentAudioAction, setCurrentPlaylistAction } from '../model'
import { type AudioPlayerData } from '../ui/PlayerControls.types'
import { usePlayer } from './usePlayer'

export const usePlayNewSermon = () => {
  const { loadAudio, play, setLockScreenMetadata } = usePlayer()

  const currentAudio = useAtom(currentAudioAtom)[0]
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const openPlayerFullscreen = useAction(setPlayerFullscreen)

  interface PlayNewSermonProps {
    playlist: PlaylistData
    sermon: SermonData
  }

  return async ({
    playlist,
    sermon: { artist, audioUrl, id, title, ...other },
  }: PlayNewSermonProps) => {
    if (!audioUrl) return

    const newAudio: AudioPlayerData = {
      ...other,
      artist: artist ?? '',
      artwork: playlist.artwork ?? '',
      audioUrl,
      id: id ?? '',
      title: title ?? '',
    }

    await setCurrentAudio(newAudio)
    await setCurrentPlaylist(playlist)

    void openPlayerFullscreen(true)

    if (currentAudio?.id !== id) await loadAudio(newAudio.audioUrl)

    await play()

    // Set metadata for lock screen controls
    setLockScreenMetadata({
      albumTitle: playlist.title,
      artist: newAudio.artist,
      artworkUrl: newAudio.artwork,
      title: newAudio.title,
    })
  }
}
