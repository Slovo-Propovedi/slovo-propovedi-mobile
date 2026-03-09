import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared/constants'
import type { Audio } from 'expo-av'

export const currentSoundAtom = atom<Audio.Sound | null>(null, 'currentSoundAtom')
export const currentSoundDurationAtom = atom(0, 'currentSoundDurationAtom')
export const currentSoundPositionAtom = atom(0, 'currentSoundPositionAtom')
export const isCurrentSoundBufferingAtom = atom(false, 'isCurrentSoundBufferingAtom')
export const isPlayingCurrentAudioAtom = atom(false, 'isPlayingCurrentAudioAtom')

export const setCurrentSound = action(async (ctx, sound: Audio.Sound | null) => {
  await ctx.schedule(() => {
    currentSoundAtom(ctx, sound)
  })
  return sound
}, 'setCurrentSound')

export const setCurrentSoundDuration = action(async (ctx, duration: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(duration))
  await ctx.schedule(() => {
    currentSoundDurationAtom(ctx, duration)
  })
  return duration
}, 'setCurrentSoundDuration')

export const setCurrentSoundPosition = action(async (ctx, position: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
  await ctx.schedule(() => {
    currentSoundPositionAtom(ctx, position)
  })
  return position
}, 'setCurrentSoundPosition')

export const setIsCurrentSoundBuffering = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isCurrentSoundBufferingAtom(ctx, value)
  })
  return value
}, 'setIsCurrentSoundBuffering')

export const setIsPlayingCurrentAudio = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isPlayingCurrentAudioAtom(ctx, value)
  })
  return value
}, 'setIsPlayingCurrentAudio')
