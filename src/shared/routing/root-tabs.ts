import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export enum RootTabName {
  Info = 'О служении',
  Listen = 'Слушать',
  Read = 'Читать',
  Study = 'Учиться',
}

export type RootTabsParamList = {
  [RootTabName.Info]: { id: number };
  [RootTabName.Listen]: undefined;
  [RootTabName.Read]: undefined;
  [RootTabName.Study]: undefined;
};

export type RootTabsScreenProps<Screen extends keyof RootTabsParamList> = BottomTabScreenProps<
  RootTabsParamList,
  Screen
>;

export type RootTabsNavProp<Screen extends keyof RootTabsParamList> = BottomTabNavigationProp<
  RootTabsParamList,
  Screen
>;
