import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { CURRENT_AUDIO, CURRENT_PLAYLIST } from 'shared/constants'
import type { AudioPlayerData } from 'entities/player'
import type { PlaylistData } from 'shared/types'

export const currentAudioAtom = atom<AudioPlayerData | null>(null, 'currentAudioAtom')
export const currentPlaylistAtom = atom<null | PlaylistData>(null, 'currentPlaylistAtom')

export const setCurrentAudio = action(async (_ctx, audio: AudioPlayerData) => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(audio))
  return audio
}, 'setCurrentAudio')
export const setCurrentPlaylist = action(async (_ctx, playlist: PlaylistData) => {
  await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(playlist))
  return playlist
}, 'setCurrentPlaylist')
