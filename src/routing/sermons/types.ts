import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { PlaylistData } from 'widgets';

export enum SermonsStackParamName {
  SermonsTabs = 'SermonsTabs',
  Playlist = 'Playlist',
}

export type SermonsStackParamList = {
  [SermonsStackParamName.SermonsTabs]: undefined;
  [SermonsStackParamName.Playlist]: PlaylistData;
};

export type SermonsStackScreenProps<Screen extends keyof SermonsStackParamList> =
  NativeStackScreenProps<SermonsStackParamList, Screen>;

export type SermonsStackNavProp<Screen extends keyof SermonsStackParamList> =
  NativeStackNavigationProp<SermonsStackParamList, Screen>;
