import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ListenRouting, ReadRouting, StudyRouting } from 'routing';
import { Info } from 'pages/info';
import { CustomTabBar } from 'widgets';
import { RootTabsParamList, RootTabName, COLORS } from 'shared';

const Tab = createBottomTabNavigator<RootTabsParamList>();

export const Routing = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === RootTabName.Study) {
            return (
              <MaterialCommunityIcons
                name={focused ? 'notebook-edit' : 'notebook-edit-outline'}
                size={size}
                color={color}
              />
            );
          }

          if (route.name === RootTabName.Listen) {
            return <AntDesign name={focused ? 'play' : 'playcircleo'} size={size} color={color} />;
          }

          const iconName = (() => {
            if (route.name === RootTabName.Info) {
              return focused ? 'information' : 'information-outline';
            }

            return focused ? 'book' : 'book-outline';
          })();

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        lazy: route.name !== RootTabName.Study,
      })}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name={RootTabName.Listen} component={ListenRouting} />
      <Tab.Screen name={RootTabName.Read} component={ReadRouting} />
      <Tab.Screen
        name={RootTabName.Study}
        component={StudyRouting}
        // options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen name={RootTabName.Info} component={Info} />
    </Tab.Navigator>
  </NavigationContainer>
);
