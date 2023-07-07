import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export enum RootTabName {
  Main = 'Главная',
  Info = 'Информация',
}

export type RootTabsParamList = {
  [RootTabName.Main]: undefined;
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
