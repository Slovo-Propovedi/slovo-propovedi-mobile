import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av'

export const playSound = async (sound: Audio.Sound | null | undefined) => {
  if (!sound) return

  await sound.playAsync()
}

export const pauseSound = async (sound: Audio.Sound | null | undefined) => {
  if (!sound) return

  await sound.pauseAsync()
}

export const stopSound = async (sound: Audio.Sound | null | undefined) => {
  if (!sound) return

  await sound.stopAsync()
}

export const unloadSound = async (sound: Audio.Sound | null | undefined) => {
  if (!sound) return

  await sound.stopAsync()
  await sound.unloadAsync()
}

export const setAudioMode = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    playsInSilentModeIOS: true,
    playThroughEarpieceAndroid: false,
    shouldDuckAndroid: true,
    staysActiveInBackground: true,
  })
}
