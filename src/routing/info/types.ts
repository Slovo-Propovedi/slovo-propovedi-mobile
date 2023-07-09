import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export enum InfoStackParamName {
  Home = 'Home',
}

export type InfoStackParamList = {
  [InfoStackParamName.Home]: undefined;
};

export type InfoStackScreenProps<Screen extends keyof InfoStackParamList> = NativeStackScreenProps<
  InfoStackParamList,
  Screen
>;

export type InfoStackNavProp<Screen extends keyof InfoStackParamList> = NativeStackNavigationProp<
  InfoStackParamList,
  Screen
>;
