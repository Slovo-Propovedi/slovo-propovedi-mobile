import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { reatomContext, useAction } from '@reatom/npm-react'
import * as Notifications from 'expo-notifications'
import React, { useEffect } from 'react'
import {
  setCurrentAudio as setCurrentAudioAction,
  setCurrentPlaylist as setCurrentPlaylistAction,
} from 'features/sermon-player-controls'
import {
  type AudioPlayerData,
  setCurrentSound as setCurrentSoundAction,
  usePlayer,
} from 'entities/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION } from 'shared/constants'
import { parseJSONToObject } from 'shared/lib'
import type { PlaylistData } from 'shared/types'
import { RootTabs } from './routing'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    allowAnnouncements: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const ctx = createCtx()

const App = () => {
  const setCurrentAudio = useAction(setCurrentAudioAction)
  const setCurrentPlaylist = useAction(setCurrentPlaylistAction)
  const setCurrentSound = useAction(setCurrentSoundAction)
  const { recreateSound, unload } = usePlayer()

  useEffect(() => {
    const initPlayerData = async () => {
      try {
        const [[, storedCurrentAudio], [, storedCurrentPlaylist], [, storedSoundPosition]] =
          await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION])

        if (storedCurrentAudio) {
          const audio = parseJSONToObject<AudioPlayerData>(storedCurrentAudio)
          if (audio) {
            await setCurrentAudio(audio)
            const sound = await recreateSound(audio.audioUrl, Number(storedSoundPosition) || 0)
            if (sound) await setCurrentSound(sound)
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
