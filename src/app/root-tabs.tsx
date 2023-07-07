import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { RootTabName, RootTabsParamList } from 'shared';
import { InfoRouting, MainRouting } from './routes';

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const RootTabs = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = (() => {
            if (route.name === RootTabName.Main) {
              return focused ? 'home' : 'home-outline';
            } else if (route.name === RootTabName.Info) {
              return focused ? 'information' : 'information-outline';
            }
          })();

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name={RootTabName.Main} component={MainRouting} options={{ tabBarBadge: 3 }} />
      <Tab.Screen name={RootTabName.Info} component={InfoRouting} />
    </Tab.Navigator>
  </NavigationContainer>
);
