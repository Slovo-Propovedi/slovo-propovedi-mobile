import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { Playlist } from 'shared';

export enum SermonsStackParamName {
  Sermons = 'Sermons',
  Playlist = 'Playlist',
  Sermon = 'Sermon',
}

export type SermonsStackParamList = {
  [SermonsStackParamName.Sermons]: undefined;
  [SermonsStackParamName.Playlist]: Playlist;
  [SermonsStackParamName.Sermon]: undefined;
};

export type SermonsStackScreenProps<Screen extends keyof SermonsStackParamList> =
  NativeStackScreenProps<SermonsStackParamList, Screen>;

export type SermonsStackNavProp<Screen extends keyof SermonsStackParamList> =
  NativeStackNavigationProp<SermonsStackParamList, Screen>;
