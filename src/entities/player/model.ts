import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import z from 'zod'
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_REPEAT_MODE,
  CURRENT_SOUND_POSITION,
  CURRENT_SOUND_VOLUME,
} from 'shared/config'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'

// Legacy atoms for backward compatibility
export const currentAudioAtom = atom<AudioPlayerData | null>(null, 'currentAudioAtom')
export const currentPlaylistAtom = atom<null | PlaylistData>(null, 'currentPlaylistAtom')

// Player state atoms (synced with expo-audio)
export const isPlayingAtom = atom(false, 'isPlayingAtom')
export const positionAtom = atom(0, 'positionAtom')
export const durationAtom = atom(0, 'durationAtom')
export const volumeAtom = atom(1, 'volumeAtom')
export const isBufferingAtom = atom(false, 'isBufferingAtom')
export const isSeekingAtom = atom(false, 'isSeekingAtom')

// Pause type: 'auto' = interrupted by system (phone call), 'manual' = user paused
export const PauseType = {
  Auto: 'auto',
  Manual: 'manual',
} as const
export type PauseType = (typeof PauseType)[keyof typeof PauseType]

export const pauseTypeAtom = atom<null | PauseType>(null, 'pauseTypeAtom')

export const RepeatMode = {
  Off: 'off',
  Queue: 'queue',
  Track: 'track',
} as const
export type RepeatMode = (typeof RepeatMode)[keyof typeof RepeatMode]

export const repeatModeSchema = z.enum(Object.values(RepeatMode))

export const repeatModeAtom = atom<RepeatMode>('off', 'repeatModeAtom')

export const setCurrentAudioAction = action(async (ctx, audio: AudioPlayerData) => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(audio))
  await ctx.schedule(() => {
    currentAudioAtom(ctx, audio)
  })
  return audio
}, 'setCurrentAudio')

export const setCurrentPlaylistAction = action(async (ctx, playlist: PlaylistData) => {
  await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(playlist))
  await ctx.schedule(() => {
    currentPlaylistAtom(ctx, playlist)
  })
  return playlist
}, 'setCurrentPlaylist')

export const setIsPlayingAction = action(async (ctx, playing: boolean) => {
  if (ctx.get(isPlayingAtom) === playing) return playing
  await ctx.schedule(() => {
    isPlayingAtom(ctx, playing)
  })
  return playing
}, 'setIsPlaying')

export const setPositionAction = action(async (ctx, position: number) => {
  await ctx.schedule(() => {
    positionAtom(ctx, position)
  })
  return position
}, 'setPosition')

export const setIsSeekingAction = action(async (ctx, value: boolean) => {
  await ctx.schedule(() => {
    isSeekingAtom(ctx, value)
  })
  return value
}, 'setIsSeeking')

export const setDurationAction = action(async (ctx, duration: number) => {
  if (ctx.get(durationAtom) === duration) return duration
  await ctx.schedule(() => {
    durationAtom(ctx, duration)
  })
  return duration
}, 'setDuration')

export const setVolumeAction = action(async (ctx, volume: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_VOLUME, String(volume))
  await ctx.schedule(() => {
    volumeAtom(ctx, volume)
  })
  return volume
}, 'setVolume')

export const setIsBufferingAction = action(async (ctx, buffering: boolean) => {
  if (ctx.get(isBufferingAtom) === buffering) return buffering
  await ctx.schedule(() => {
    isBufferingAtom(ctx, buffering)
  })
  return buffering
}, 'setIsBuffering')

export const setPauseTypeAction = action(async (ctx, pauseType: null | PauseType) => {
  await ctx.schedule(() => {
    pauseTypeAtom(ctx, pauseType)
  })
  return pauseType
}, 'setPauseType')

export const setRepeatModeAction = action(async (ctx, mode: RepeatMode) => {
  await AsyncStorage.setItem(CURRENT_REPEAT_MODE, mode)
  await ctx.schedule(() => {
    repeatModeAtom(ctx, mode)
  })
  return mode
}, 'setRepeatMode')

export const savePlaybackPositionAction = action(async (_ctx, position: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
  return position
}, 'savePlaybackPosition')
