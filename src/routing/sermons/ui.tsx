import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { PlaylistScreen, SermonsScreen } from 'pages';
import { SermonCardScreen } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { SermonsStackParamList, SermonsStackParamName } from './types';

const SermonsStack = createNativeStackNavigator<SermonsStackParamList>();

export const SermonsRouting: FC<RootTabsScreenProps<RootTabName.Sermons>> = () => (
  <SermonsStack.Navigator
    initialRouteName={SermonsStackParamName.Sermons}
    screenOptions={(params) => {
      const { name: routeName, params: routeParams } = params.route;

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
        headerShown: routeName !== SermonsStackParamName.Sermons,
        title,
        headerBackButtonMenuEnabled: false,
      };
    }}
  >
    <SermonsStack.Screen name={SermonsStackParamName.Sermons} component={SermonsScreen} />
    <SermonsStack.Screen name={SermonsStackParamName.Playlist} component={PlaylistScreen} />
    <SermonsStack.Screen name={SermonsStackParamName.SermonCard} component={SermonCardScreen} />
  </SermonsStack.Navigator>
);
