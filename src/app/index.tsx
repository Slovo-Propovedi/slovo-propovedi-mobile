import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SermonsRouting, LibraryRouting, BibleSchoolRouting, InfoRouting } from 'routing';
import { RootTabsParamList, RootTabName } from 'shared';

const Tab = createBottomTabNavigator<RootTabsParamList>();

const App = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === RootTabName.BibleSchool) {
            return (
              <MaterialCommunityIcons
                name={focused ? 'notebook-edit' : 'notebook-edit-outline'}
                size={size}
                color={color}
              />
            );
          }

          const iconName = (() => {
            if (route.name === RootTabName.Sermons) {
              return focused ? 'ios-book' : 'ios-book-outline';
            } else if (route.name === RootTabName.Info) {
              return focused ? 'information' : 'information-outline';
            } else if (route.name === RootTabName.Library) {
              return focused ? 'library' : 'library-outline';
            }
          })();

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name={RootTabName.Sermons} component={SermonsRouting} />
      <Tab.Screen name={RootTabName.Library} component={LibraryRouting} />
      <Tab.Screen
        name={RootTabName.BibleSchool}
        component={BibleSchoolRouting}
        // options={{ tabBarBadge: 3 }}
      />
      <Tab.Screen name={RootTabName.Info} component={InfoRouting} />
    </Tab.Navigator>
  </NavigationContainer>
);

export default App;
