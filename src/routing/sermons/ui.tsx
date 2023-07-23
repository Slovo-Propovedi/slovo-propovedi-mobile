import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PlaylistScreen, SermonsTabsScreen, SermonCardScreen } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { SermonsStackParamList, SermonsStackParamName } from './types';

const SermonsStack = createNativeStackNavigator<SermonsStackParamList>();

export const SermonsRouting: React.FC<RootTabsScreenProps<RootTabName.Sermons>> = () => (
  <SermonsStack.Navigator
    initialRouteName={SermonsStackParamName.SermonsTabs}
    screenOptions={({ route }) => {
      const { name: routeName, params: routeParams } = route;

      const title = (() => {
        if (!routeParams) {
          return routeName;
        }

        if (
          routeName === SermonsStackParamName.Playlist ||
          routeName === SermonsStackParamName.SermonCard
        ) {
          return routeParams.title;
        }

        return routeName;
      })();

      return {
        headerShown: routeName !== SermonsStackParamName.SermonsTabs,
        title,
        // headerTintColor: COLORS.primary,
      };
    }}
  >
    <SermonsStack.Screen name={SermonsStackParamName.SermonsTabs} component={SermonsTabsScreen} />
    <SermonsStack.Screen name={SermonsStackParamName.Playlist} component={PlaylistScreen} />
    <SermonsStack.Screen name={SermonsStackParamName.SermonCard} component={SermonCardScreen} />
  </SermonsStack.Navigator>
);
