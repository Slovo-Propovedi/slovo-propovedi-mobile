import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export enum LibraryStackParamName {
  Home = 'Home',
}

export type LibraryStackParamList = {
  [LibraryStackParamName.Home]: undefined;
};

export type LibraryStackScreenProps<Screen extends keyof LibraryStackParamList> =
  NativeStackScreenProps<LibraryStackParamList, Screen>;

export type LibraryStackNavProp<Screen extends keyof LibraryStackParamList> =
  NativeStackNavigationProp<LibraryStackParamList, Screen>;
