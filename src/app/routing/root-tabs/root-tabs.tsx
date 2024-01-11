import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Info } from 'pages/info';
import type { RootTabsParamList } from 'shared';
import { COLORS, RootTabName } from 'shared';
import { ListenRouting } from '../listen';
import { ReadRouting } from '../read';
import { StudyRouting } from '../study';
import { CustomTabBar } from './custom-tab-bar';

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const RootTabs = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        lazy: route.name !== RootTabName.Study,
        tabBarActiveTintColor: COLORS.primary,
        tabBarIcon: ({ color, focused, size }) => {
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
            if (route.name === RootTabName.Info)
              return focused ? 'information' : 'information-outline';

            return focused ? 'book' : 'book-outline';
          })();

          return <Ionicons color={color} name={iconName} size={size} />;
        },
        tabBarInactiveTintColor: 'gray',
      })}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen component={ListenRouting} name={RootTabName.Listen} />
      <Tab.Screen component={ReadRouting} name={RootTabName.Read} />
      <Tab.Screen
        component={StudyRouting}
        name={RootTabName.Study}
        // options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen component={Info} name={RootTabName.Info} />
    </Tab.Navigator>
  </NavigationContainer>
);
