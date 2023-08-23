import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export enum StudyStackParamName {
  Home = 'Home',
}

export type StudyStackParamList = {
  [StudyStackParamName.Home]: undefined;
};

export type StudyStackScreenProps<Screen extends keyof StudyStackParamList> =
  NativeStackScreenProps<StudyStackParamList, Screen>;

export type StudyStackNavProp<Screen extends keyof StudyStackParamList> = NativeStackNavigationProp<
  StudyStackParamList,
  Screen
>;
