import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ListenRouting, ReadRouting, StudyRouting } from 'routing';
import { Info } from 'pages';
import { RootTabsParamList, RootTabName } from 'shared';

const Tab = createBottomTabNavigator<RootTabsParamList>();

const App = () => (
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
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
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

export default App;
