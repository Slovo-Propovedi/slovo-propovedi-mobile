import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import {
  playerService,
  setDurationAction,
  setIsBufferingAction,
  setIsPlayingAction,
  setPositionAction,
} from 'entities/player'
import { CURRENT_SOUND_POSITION } from 'shared/config'

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

export default PlaybackStateSync
