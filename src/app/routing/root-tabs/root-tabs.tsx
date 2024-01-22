import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Info } from 'pages/info';
import type { RootTabsParamList } from 'shared';
import { COLORS, RootTabName } from 'shared';
import { ListenRouting } from '../listen';
import { ReadRouting } from '../read';
import { StudyRouting } from '../study';
import { CustomTabBar } from './custom-tab-bar';

const { Navigator, Screen } = createBottomTabNavigator<RootTabsParamList>();

interface TabBarIconProps {
  color: string;
  focused: boolean;
  size: number;
}

type RouteType = RouteProp<RootTabsParamList, keyof RootTabsParamList>;

const getTabBarIcon =
  (route: RouteType) =>
  ({ color, focused, size }: TabBarIconProps): React.ReactNode => {
    if (route.name === RootTabName.Study)
      return (
        <MaterialCommunityIcons
          color={color}
          name={focused ? 'notebook-edit' : 'notebook-edit-outline'}
          size={size}
        />
      );

    if (route.name === RootTabName.Listen)
      return <AntDesign color={color} name={focused ? 'play' : 'playcircleo'} size={size} />;

    const iconName = (() => {
      if (route.name === RootTabName.Info) return focused ? 'information' : 'information-outline';

      return focused ? 'book' : 'book-outline';
    })();

    return <Ionicons color={color} name={iconName} size={size} />;
  };

const tabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;
const screenOptions = ({ route }: { route: RouteType }) =>
  ({
    headerShown: false,
    lazy: route.name !== RootTabName.Study,
    tabBarActiveTintColor: COLORS.primary,
    tabBarIcon: getTabBarIcon(route),
    tabBarInactiveTintColor: 'gray',
  }) satisfies BottomTabNavigationOptions;

export const RootTabs = () => (
  <NavigationContainer>
    <Navigator screenOptions={screenOptions} tabBar={tabBar}>
      <Screen component={ListenRouting} name={RootTabName.Listen} />
      <Screen component={ReadRouting} name={RootTabName.Read} />
      <Screen
        component={StudyRouting}
        name={RootTabName.Study}
        // options={{ tabBarBadge: 3 }}
      />
      <Screen component={Info} name={RootTabName.Info} />
    </Navigator>
  </NavigationContainer>
);
