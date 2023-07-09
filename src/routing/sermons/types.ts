import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

export enum SermonsStackParamName {
  Home = 'Home',
}

export type SermonsStackParamList = {
  [SermonsStackParamName.Home]: undefined;
};

export type SermonsStackScreenProps<Screen extends keyof SermonsStackParamList> =
  NativeStackScreenProps<SermonsStackParamList, Screen>;

export type SermonsStackNavProp<Screen extends keyof SermonsStackParamList> =
  NativeStackNavigationProp<SermonsStackParamList, Screen>;
