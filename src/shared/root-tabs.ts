import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export enum RootTabName {
  Sermons = 'Проповеди',
  Library = 'Библиотека',
  BibleSchool = 'Библейская школа',
  Info = 'О служении',
}

export type RootTabsParamList = {
  [RootTabName.Sermons]: undefined;
  [RootTabName.Library]: undefined;
  [RootTabName.BibleSchool]: undefined;
  [RootTabName.Info]: { id: number };
};

export type RootTabsScreenProps<Screen extends keyof RootTabsParamList> = BottomTabScreenProps<
  RootTabsParamList,
  Screen
>;

export type RootTabsNavProp<Screen extends keyof RootTabsParamList> = BottomTabNavigationProp<
  RootTabsParamList,
  Screen
>;
