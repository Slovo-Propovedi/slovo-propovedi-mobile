import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { reatomContext, useAction } from '@reatom/npm-react'
import React, { useEffect } from 'react'
import {
  setCurrentAudio as setCurrentAudioAction,
  setCurrentPlaylist as setCurrentPlaylistAction,
} from 'features/sermon-player-controls'
import { type AudioPlayerData, usePlayer } from 'entities/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION } from 'shared/constants'
import { parseJSONToObject } from 'shared/lib'
import type { PlaylistData } from 'shared/types'
import { RootTabs } from './routing'

const ctx = createCtx()

const App = () => {
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

  return <RootTabs />
}

const AppWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <App />
  </reatomContext.Provider>
)

export default AppWithProvider
