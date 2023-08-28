import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { PlaylistData } from 'widgets';

export enum ListenStackParamName {
  ListenHome = 'ListenHome',
  Playlist = 'Playlist',
  PlaylistList = 'PlaylistList',
}

export type ListenStackParamList = {
  [ListenStackParamName.ListenHome]: undefined;
  [ListenStackParamName.Playlist]: PlaylistData;
  [ListenStackParamName.PlaylistList]: PlaylistData[];
};

export type ListenStackScreenProps<Screen extends keyof ListenStackParamList> =
  NativeStackScreenProps<ListenStackParamList, Screen>;

export type ListenStackNavProp<Screen extends keyof ListenStackParamList> =
  NativeStackNavigationProp<ListenStackParamList, Screen>;
