import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { reatomContext, useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import z from 'zod'
import {
  audioPlayerDataSchema,
  playerService,
  repeatModeSchema,
  setCurrentAudioAction,
  setCurrentPlaylistAction,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPositionAction,
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

const ctx = createCtx()

const PlaybackStateSync = () => {
  const updateIsPlaying = useAction(setIsPlayingAction)
  const updatePosition = useAction(setPositionAction)
  const updateDuration = useAction(setDurationAction)
  const updateIsBuffering = useAction(setIsBufferingAction)

  useEffect(() => {
    const unsubscribe = playerService.subscribe(() => {
      const state = playerService.getState()
      void updateIsPlaying(state.isPlaying)
      void updatePosition(state.position)
      void updateDuration(state.duration)
      void updateIsBuffering(state.isBuffering)
    })
    return () => {
      unsubscribe()
    }
  }, [updateIsPlaying, updatePosition, updateDuration, updateIsBuffering])

  useEffect(() => {
    const savePosition = async () => {
      const state = playerService.getState()
      if (!state.isPlaying)
        await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(state.position))
    }
    const interval = setInterval(savePosition, 5000)
    return () => clearInterval(interval)
  }, [])

  return null
}

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

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout />
    </GestureHandlerRootView>
  </reatomContext.Provider>
)

export default RootLayoutWithProvider
