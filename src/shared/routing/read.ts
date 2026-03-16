import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack'
import type { BookData } from 'shared/model'
import { type BaseParamList } from './base'

export enum ReadStackParamName {
  BookReader = 'BookReader',
  BooksList = 'BooksList',
  Home = 'Home',
}

export type ReadStackNavProp<Screen extends keyof ReadStackParamList> = NativeStackNavigationProp<
  ReadStackParamList,
  Screen
>

export type ReadStackParamList = BaseParamList<{
  [ReadStackParamName.BookReader]: BookData
  [ReadStackParamName.BooksList]: { books: BookData[]; title: string }
  [ReadStackParamName.Home]: undefined
}>

export type ReadStackScreenProps<Screen extends keyof ReadStackParamList> = NativeStackScreenProps<
  ReadStackParamList,
  Screen
>
