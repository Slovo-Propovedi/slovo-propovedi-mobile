import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { type BaseParamList } from './base'

export enum RootTabName {
  Info = 'Информация',
  Listen = 'Слушать',
  Read = 'Читать',
  Study = 'Учиться',
}

export type RootTabsNavProp<Screen extends keyof RootTabsParamList> = BottomTabNavigationProp<
  RootTabsParamList,
  Screen
>

export type RootTabsParamList = BaseParamList<{
  [RootTabName.Info]: { id: number }
  [RootTabName.Listen]: undefined
  [RootTabName.Read]: undefined
  [RootTabName.Study]: undefined
}>

export type RootTabsScreenProps<Screen extends keyof RootTabsParamList> = BottomTabScreenProps<
  RootTabsParamList,
  Screen
>
