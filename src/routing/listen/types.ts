import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { PlaylistData } from 'widgets';
import { AudioPlayerData } from 'features';

export enum ListenStackParamName {
  ListenHome = 'ListenHome',
  Playlist = 'Playlist',
  PlaylistList = 'PlaylistList',
  AudioPlayer = 'AudioPlayer',
}

export type ListenStackParamList = {
  [ListenStackParamName.ListenHome]: undefined;
  [ListenStackParamName.Playlist]: PlaylistData;
  [ListenStackParamName.PlaylistList]: { playlists: PlaylistData[]; title: string };
  [ListenStackParamName.AudioPlayer]: AudioPlayerData;
};

export type ListenStackScreenProps<Screen extends keyof ListenStackParamList> =
  NativeStackScreenProps<ListenStackParamList, Screen>;

export type ListenStackNavProp<Screen extends keyof ListenStackParamList> =
  NativeStackNavigationProp<ListenStackParamList, Screen>;
