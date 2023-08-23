import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export enum RootTabName {
  Listen = 'Слушать',
  Read = 'Читать',
  Study = 'Учиться',
  Info = 'О служении',
}

export type RootTabsParamList = {
  [RootTabName.Listen]: undefined;
  [RootTabName.Read]: undefined;
  [RootTabName.Study]: undefined;
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
