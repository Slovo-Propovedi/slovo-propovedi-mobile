import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export enum ReadStackParamName {
  Home = 'Home',
}

export type ReadStackParamList = {
  [ReadStackParamName.Home]: undefined;
};

export type ReadStackScreenProps<Screen extends keyof ReadStackParamList> = NativeStackScreenProps<
  ReadStackParamList,
  Screen
>;

export type ReadStackNavProp<Screen extends keyof ReadStackParamList> = NativeStackNavigationProp<
  ReadStackParamList,
  Screen
>;
