import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { reatomContext, useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import React, { useEffect } from 'react'
import {
  setCurrentAudio as setCurrentAudioAction,
  setCurrentPlaylist as setCurrentPlaylistAction,
} from 'features/sermon-player-controls'
import { type AudioPlayerData, usePlayer } from 'entities/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION } from 'shared/config'
import { parseJSONToObject } from 'shared/lib/utils'
import type { PlaylistData } from 'shared/model'

const ctx = createCtx()

const RootLayout = () => {
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const { loadAudio, unload } = usePlayer()

  useEffect(() => {
    const initPlayerData = async () => {
      try {
        const [[, storedCurrentAudio], [, storedCurrentPlaylist], [, storedSoundPosition]] =
          await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION])

        if (storedCurrentAudio) {
          const audio = parseJSONToObject<AudioPlayerData>(storedCurrentAudio)
          if (audio) {
            await setCurrentAudio(audio)
            await loadAudio(audio.audioUrl, Number(storedSoundPosition) || 0)
          }
        }

        if (storedCurrentPlaylist) {
          const playlist = parseJSONToObject<PlaylistData>(storedCurrentPlaylist)
          if (playlist) await setCurrentPlaylist(playlist)
        }
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  )
}

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <RootLayout />
  </reatomContext.Provider>
)

export default RootLayoutWithProvider
