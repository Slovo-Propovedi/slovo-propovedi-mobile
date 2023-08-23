import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PlaylistScreen, ListenScreen } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { ListenStackParamList, ListenStackParamName } from './types';

const ListenStack = createNativeStackNavigator<ListenStackParamList>();

export const ListenRouting: React.FC<RootTabsScreenProps<RootTabName.Listen>> = () => (
  <ListenStack.Navigator initialRouteName={ListenStackParamName.ListenHome}>
    <ListenStack.Screen
      name={ListenStackParamName.ListenHome}
      component={ListenScreen}
      options={({ route }) => {
        const { name: routeName } = route;

        return {
          headerShown: false,
          title: routeName,
          // headerTintColor: COLORS.primary,
        };
      }}
    />
    <ListenStack.Screen
      name={ListenStackParamName.Playlist}
      component={PlaylistScreen}
      options={({ route: { params } }) => ({
        headerShown: true,
        title: params.title,
        // headerTintColor: COLORS.primary,
      })}
    />
  </ListenStack.Navigator>
);
