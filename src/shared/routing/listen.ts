import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export interface PlaylistList {
  audioUrl?: string;

  description?: string;

  id: string;

  textFileUrl?: string;

  title: string;

  youtubeUrl?: string;
}

export interface PlaylistProps {
  description?: string;
  list: PlaylistList[];
  previewUrl?: string;
  title: string;
}

export enum ListenStackParamName {
  AudioPlayer = 'AudioPlayer',
  ListenHome = 'ListenHome',
  Playlist = 'Playlist',
  PlaylistList = 'PlaylistList',
}

export type ListenStackParamList = {
  [ListenStackParamName.AudioPlayer]: undefined;
  [ListenStackParamName.ListenHome]: undefined;
  [ListenStackParamName.Playlist]: PlaylistProps;
  [ListenStackParamName.PlaylistList]: { playlists: PlaylistProps[]; title: string };
};

export type ListenStackScreenProps<Screen extends keyof ListenStackParamList> =
  NativeStackScreenProps<ListenStackParamList, Screen>;

export type ListenStackNavProp<Screen extends keyof ListenStackParamList> =
  NativeStackNavigationProp<ListenStackParamList, Screen>;
