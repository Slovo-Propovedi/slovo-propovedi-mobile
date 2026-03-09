import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import { type BaseParamList } from './base'

export enum ListenStackParamName {
  AudioPlayer = 'AudioPlayer',
  ListenHome = 'ListenHome',
  Playlist = 'Playlist',
  PlaylistList = 'PlaylistList',
}

export type ListenStackNavProp<Screen extends keyof ListenStackParamList> =
  NativeStackNavigationProp<ListenStackParamList, Screen>

export type ListenStackParamList = BaseParamList<{
  [ListenStackParamName.AudioPlayer]: undefined
  [ListenStackParamName.ListenHome]: undefined
  [ListenStackParamName.Playlist]: PlaylistProps
  [ListenStackParamName.PlaylistList]: { playlists: PlaylistProps[]; title: string }
}>

export type ListenStackScreenProps<Screen extends keyof ListenStackParamList> =
  NativeStackScreenProps<ListenStackParamList, Screen>

export interface PlaylistList {
  audioUrl?: string

  description?: string

  id: string

  textFileUrl?: string

  title: string

  youtubeUrl?: string
}

export interface PlaylistProps {
  description?: string
  list: PlaylistList[]
  previewUrl?: string
  title: string
}
