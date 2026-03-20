import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import z from 'zod'
import {
  audioPlayerDataSchema,
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
import PlaybackStateSync from './_PlaybackStateSync'

const RootLayout = () => {
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const setRepeatMode = useAction(setRepeatModeAction)
  const { loadAudio, setVolume, unload } = usePlayer()

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

  return (
    <>
      <PlaybackStateSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default RootLayout
