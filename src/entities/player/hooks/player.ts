import { useAction, useAtom } from '@reatom/npm-react'
import type { Audio } from 'expo-av'
import {
  currentSoundAtom,
  currentSoundDurationAtom,
  currentSoundPositionAtom,
  isPlayingCurrentAudioAtom,
  setCurrentSound as setCurrentSoundAction,
  setCurrentSoundDuration as setCurrentSoundDurationAction,
  setCurrentSoundPosition as setCurrentSoundPositionAction,
  setIsCurrentSoundBuffering as setIsCurrentSoundBufferingAction,
  setIsPlayingCurrentAudio as setIsPlayingCurrentAudioAction,
} from '../model'
import { cancelScheduledNotificationAsync, loadCachedSoundData } from '../utils'
import { useLocalNotification } from './push'
import { pauseSound, playSound, setAudioMode, stopSound, unloadSound } from './sound-utils'

export const usePlayer = () => {
  useLocalNotification()

  const currentSound = useAtom(currentSoundAtom)[0]
  const currentSoundDuration = useAtom(currentSoundDurationAtom)[0]
  const currentSoundPosition = useAtom(currentSoundPositionAtom)[0]
  const isPlayingCurrentAudio = useAtom(isPlayingCurrentAudioAtom)[0]
  const setCurrentSound = useAction(setCurrentSoundAction)
  const setCurrentSoundDuration = useAction(setCurrentSoundDurationAction)
  const setCurrentSoundPosition = useAction(setCurrentSoundPositionAction)
  const setIsCurrentSoundBuffering = useAction(setIsCurrentSoundBufferingAction)
  const setIsPlayingCurrentAudio = useAction(setIsPlayingCurrentAudioAction)

  const play = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound
    await playSound(sound)
  }

  const pause = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound
    await pauseSound(sound)
    await cancelScheduledNotificationAsync()
  }

  const stop = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound
    await stopSound(sound)
  }

  const unload = async (newSound?: Audio.Sound) => {
    const sound = newSound || currentSound
    await unloadSound(sound)
  }

  const recreateSound = async (newAudioUrl: string, initialPosition?: number) => {
    if (currentSound) {
      await stopSound(currentSound)
      await unloadSound(currentSound)
    }

    await setAudioMode()

    const position = initialPosition || 0
    void setIsCurrentSoundBuffering(true)

    const data = await loadCachedSoundData({
      initialPosition: position,
      remoteUri: newAudioUrl,
    })

    if (!data) return

    const { audio, status } = data

    if (status.isLoaded) {
      await setCurrentSoundDuration(status.durationMillis || 0)
      void setIsCurrentSoundBuffering(false)
    }

    let prevIsPlaying: boolean | undefined

    audio.setOnPlaybackStatusUpdate(async playbackStatus => {
      if (!playbackStatus.isLoaded) return

      const { isPlaying, positionMillis } = playbackStatus

      if (prevIsPlaying !== isPlaying) {
        void setIsPlayingCurrentAudio(isPlaying)
        prevIsPlaying = isPlaying
      }

      if (positionMillis && positionMillis !== currentSoundPosition)
        void setCurrentSoundPosition(positionMillis)
    })

    void setCurrentSound(audio)

    return audio
  }

  const changeProgressPosition = async (newPosition: number) => {
    if (!currentSound) return

    await currentSound.setPositionAsync(newPosition)
    void setCurrentSoundPosition(newPosition)
  }

  return {
    changeProgressPosition,
    duration: currentSoundDuration,
    isPlaying: isPlayingCurrentAudio,
    pause,
    play,
    position: currentSoundPosition,
    recreateSound,
    stop,
    unload,
  }
}
