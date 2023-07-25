import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PlaylistScreen, SermonsTabsScreen, SermonCardScreen } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { SermonsStackParamList, SermonsStackParamName } from './types';

const SermonsStack = createNativeStackNavigator<SermonsStackParamList>();

export const SermonsRouting: React.FC<RootTabsScreenProps<RootTabName.Sermons>> = () => (
  <SermonsStack.Navigator initialRouteName={SermonsStackParamName.SermonsTabs}>
    <SermonsStack.Screen
      name={SermonsStackParamName.SermonsTabs}
      component={SermonsTabsScreen}
      options={({ route }) => {
        const { name: routeName } = route;

        return {
          headerShown: false,
          title: routeName,
          // headerTintColor: COLORS.primary,
        };
      }}
    />
    <SermonsStack.Screen
      name={SermonsStackParamName.Playlist}
      component={PlaylistScreen}
      options={({ route: { params } }) => ({
        headerShown: true,
        title: params.title,
        // headerTintColor: COLORS.primary,
      })}
    />
    <SermonsStack.Screen
      name={SermonsStackParamName.SermonCard}
      component={SermonCardScreen}
      options={({ route: { params } }) => ({
        headerShown: true,
        title: params.title,
        // headerTintColor: COLORS.primary,
      })}
    />
  </SermonsStack.Navigator>
);
