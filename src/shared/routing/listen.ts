import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export interface PlaylistList {
  id: string;

  title: string;

  description?: string;

  youtubeUrl?: string;

  audioUrl?: string;

  textFileUrl?: string;
}

export interface PlaylistProps {
  title: string;
  list: PlaylistList[];
  description?: string;
  previewUrl?: string;
}

export enum ListenStackParamName {
  ListenHome = 'ListenHome',
  Playlist = 'Playlist',
  PlaylistList = 'PlaylistList',
  AudioPlayer = 'AudioPlayer',
}

export type ListenStackParamList = {
  [ListenStackParamName.ListenHome]: undefined;
  [ListenStackParamName.Playlist]: PlaylistProps;
  [ListenStackParamName.PlaylistList]: { playlists: PlaylistProps[]; title: string };
  [ListenStackParamName.AudioPlayer]: undefined;
};

export type ListenStackScreenProps<Screen extends keyof ListenStackParamList> =
  NativeStackScreenProps<ListenStackParamList, Screen>;

export type ListenStackNavProp<Screen extends keyof ListenStackParamList> =
  NativeStackNavigationProp<ListenStackParamList, Screen>;
