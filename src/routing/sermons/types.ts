import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { PlaylistData } from 'widgets';
import { SermonData } from 'entities';

export enum SermonsStackParamName {
  SermonsTabs = 'SermonsTabs',
  Playlist = 'Playlist',
  SermonCard = 'SermonCard',
}

export type SermonsStackParamList = {
  [SermonsStackParamName.SermonsTabs]: undefined;
  [SermonsStackParamName.Playlist]: PlaylistData;
  [SermonsStackParamName.SermonCard]: SermonData;
};

export type SermonsStackScreenProps<Screen extends keyof SermonsStackParamList> =
  NativeStackScreenProps<SermonsStackParamList, Screen>;

export type SermonsStackNavProp<Screen extends keyof SermonsStackParamList> =
  NativeStackNavigationProp<SermonsStackParamList, Screen>;
