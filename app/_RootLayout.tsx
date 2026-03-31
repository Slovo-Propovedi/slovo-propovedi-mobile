import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction, useAtom } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import z from 'zod'
import {
  audioPlayerDataSchema,
  isPlayingAtom,
  positionAtom,
  repeatModeSchema,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
  setRepeatModeAction,
  usePlayer,
} from 'entities/player'
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_POSITION,
  CURRENT_SOUND_VOLUME,
} from 'shared/config'
import { parseJsonWithSchema, playlistDataSchema } from 'shared/model'

const RootLayout = () => {
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const setRepeatMode = useAction(setRepeatModeAction)
  const { loadAudio, setLockScreenMetadata, setVolume, unload } = usePlayer()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [position] = useAtom(positionAtom)

  useEffect(() => {
    const initPlayerData = async () => {
      try {
        const [
          [, storedCurrentAudio],
          [, storedCurrentPlaylist],
          [, storedSoundPosition],
          [, storedVolume],
          [, storedRepeatMode],
        ] = await AsyncStorage.multiGet([
          CURRENT_AUDIO,
          CURRENT_PLAYLIST,
          CURRENT_SOUND_POSITION,
          CURRENT_SOUND_VOLUME,
          CURRENT_REPEAT_MODE,
        ])

        const parsedVolume = storedVolume ? Number(storedVolume) : null
        const { data: parsedRepeat } = repeatModeSchema.safeParse(storedRepeatMode)
        const audio = parseJsonWithSchema(audioPlayerDataSchema)(storedCurrentAudio)
        const playlist = parseJsonWithSchema(playlistDataSchema)(storedCurrentPlaylist)
        const { data: validVolume } = z.number().safeParse(parsedVolume)
        if (validVolume) await setVolume(validVolume)
        if (parsedRepeat) await setRepeatMode(parsedRepeat)
        if (audio) {
          await setCurrentAudio(audio)
          await loadAudio(audio.audioUrl, Number(storedSoundPosition) || 0)
          // Set lock screen metadata for notification player
          setLockScreenMetadata({
            albumTitle: playlist?.title,
            artist: audio.artist,
            artworkUrl: audio.artwork,
            title: audio.title,
          })
        }
        if (playlist) await setCurrentPlaylist(playlist)
      } catch (error) {
        console.error('Error initializing player data:', error)
      }
    }
    void initPlayerData()
    return () => {
      void unload()
    }
  }, [])

  useEffect(() => {
    const savePosition = async () => {
      if (!isPlaying) await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
    }
    const interval = setInterval(savePosition, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, position])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  )
}

export default RootLayout
