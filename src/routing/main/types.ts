import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export type MainStackParamList = {
  Home: undefined;
};

export type MainStackScreenProps<Screen extends keyof MainStackParamList> = NativeStackScreenProps<
  MainStackParamList,
  Screen
>;

export type MainStackNavProp<Screen extends keyof MainStackParamList> = NativeStackNavigationProp<
  MainStackParamList,
  Screen
>;
