import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import {
  CURRENT_AUDIO,
  CURRENT_PLAYLIST,
  CURRENT_SOUND_POSITION,
  CURRENT_SOUND_VOLUME,
} from 'shared/config'
import type { AudioPlayerData } from 'entities/player'
import type { PlaylistData } from 'shared/model'

// Legacy atoms for backward compatibility
export const currentAudioAtom = atom<AudioPlayerData | null>(null, 'currentAudioAtom')
export const currentPlaylistAtom = atom<null | PlaylistData>(null, 'currentPlaylistAtom')

// Player state atoms (synced with expo-audio)
export const isPlayingAtom = atom(false, 'isPlayingAtom')
export const positionAtom = atom(0, 'positionAtom')
export const durationAtom = atom(0, 'durationAtom')
export const volumeAtom = atom(1, 'volumeAtom')
export const isBufferingAtom = atom(false, 'isBufferingAtom')

// Repeat mode: 'off' | 'track' | 'queue'
export type RepeatMode = 'off' | 'queue' | 'track'
export const repeatModeAtom = atom<RepeatMode>('off', 'repeatModeAtom')

// Player expanded state (for expandable player)
export const isPlayerExpandedAtom = atom(false, 'isPlayerExpandedAtom')

// Legacy alias for backward compatibility
export const isPlayerSheetOpenAtom = isPlayerExpandedAtom

export const openPlayerSheet = action(async ctx => {
  await ctx.schedule(() => {
    isPlayerExpandedAtom(ctx, true)
  })
}, 'openPlayerSheet')

export const closePlayerSheet = action(async ctx => {
  await ctx.schedule(() => {
    isPlayerExpandedAtom(ctx, false)
  })
}, 'closePlayerSheet')

export const setCurrentAudio = action(async (ctx, audio: AudioPlayerData) => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(audio))
  await ctx.schedule(() => {
    currentAudioAtom(ctx, audio)
  })
  return audio
}, 'setCurrentAudio')

export const setCurrentPlaylist = action(async (ctx, playlist: PlaylistData) => {
  await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(playlist))
  await ctx.schedule(() => {
    currentPlaylistAtom(ctx, playlist)
  })
  return playlist
}, 'setCurrentPlaylist')

export const setIsPlaying = action(async (ctx, playing: boolean) => {
  await ctx.schedule(() => {
    isPlayingAtom(ctx, playing)
  })
  return playing
}, 'setIsPlaying')

export const setPosition = action(async (ctx, position: number) => {
  await ctx.schedule(() => {
    positionAtom(ctx, position)
  })
  return position
}, 'setPosition')

export const setDuration = action(async (ctx, duration: number) => {
  await ctx.schedule(() => {
    durationAtom(ctx, duration)
  })
  return duration
}, 'setDuration')

export const setVolume = action(async (ctx, volume: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_VOLUME, String(volume))
  await ctx.schedule(() => {
    volumeAtom(ctx, volume)
  })
  return volume
}, 'setVolume')

export const setIsBuffering = action(async (ctx, buffering: boolean) => {
  await ctx.schedule(() => {
    isBufferingAtom(ctx, buffering)
  })
  return buffering
}, 'setIsBuffering')

export const setRepeatMode = action(async (ctx, mode: RepeatMode) => {
  await ctx.schedule(() => {
    repeatModeAtom(ctx, mode)
  })
  return mode
}, 'setRepeatMode')

export const savePlaybackPosition = action(async (_ctx, position: number) => {
  await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
  return position
}, 'savePlaybackPosition')
