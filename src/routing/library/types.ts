import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export type LibraryStackParamList = {
  Home: undefined;
};

export type LibraryStackScreenProps<Screen extends keyof LibraryStackParamList> =
  NativeStackScreenProps<LibraryStackParamList, Screen>;

export type LibraryStackNavProp<Screen extends keyof LibraryStackParamList> =
  NativeStackNavigationProp<LibraryStackParamList, Screen>;
