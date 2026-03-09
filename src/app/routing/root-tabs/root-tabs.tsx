import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { Info } from 'pages/info'
import { RootTabName } from 'shared/routing'
import { COLORS } from 'shared/themed'
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import type { RouteProp } from '@react-navigation/native'
import type { RootTabsParamList } from 'shared/routing'
import { ListenRouting } from '../listen'
import { ReadRouting } from '../read'
import { StudyRouting } from '../study'
import { CustomTabBar } from './custom-tab-bar'

const { Navigator, Screen } = createBottomTabNavigator<RootTabsParamList>()

type RouteType = RouteProp<RootTabsParamList, keyof RootTabsParamList>

interface TabBarIconProps {
  color: string
  focused: boolean
  size: number
}

const getTabBarIcon =
  (route: RouteType) =>
  ({ color, focused, size }: TabBarIconProps): React.ReactNode => {
    if (route.name === RootTabName.Study)
      return (
        <MaterialCommunityIcons
          size={size}
          color={color}
          name={focused ? 'notebook-edit' : 'notebook-edit-outline'}
        />
      )

    if (route.name === RootTabName.Listen)
      return <AntDesign size={size} color={color} name='play-circle' />

    const iconName = (() => {
      if (route.name === RootTabName.Info) return focused ? 'information' : 'information-outline'

      return focused ? 'book' : 'book-outline'
    })()

    return <Ionicons size={size} color={color} name={iconName} />
  }

const tabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />
const screenOptions = ({ route }: { route: RouteType }) =>
  ({
    headerShown: false,
    lazy: route.name !== RootTabName.Study,
    tabBarActiveTintColor: COLORS.primary,
    tabBarIcon: getTabBarIcon(route),
    tabBarInactiveTintColor: 'gray',
  }) satisfies BottomTabNavigationOptions

export const RootTabs = () => (
  <NavigationContainer>
    <Navigator tabBar={tabBar} screenOptions={screenOptions}>
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
)
