import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import { type BaseParamList } from './base'

export enum StudyStackParamName {
  Home = 'Home',
}

export type StudyStackNavProp<Screen extends keyof StudyStackParamList> = NativeStackNavigationProp<
  StudyStackParamList,
  Screen
>

export type StudyStackParamList = BaseParamList<{
  [StudyStackParamName.Home]: undefined
}>

export type StudyStackScreenProps<Screen extends keyof StudyStackParamList> =
  NativeStackScreenProps<StudyStackParamList, Screen>
