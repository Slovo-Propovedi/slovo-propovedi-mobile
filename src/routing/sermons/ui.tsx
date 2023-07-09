import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { HomeScreen } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { SermonsStackParamList, SermonsStackParamName } from './types';

const SermonsStack = createNativeStackNavigator<SermonsStackParamList>();

export const MainRouting: FC<RootTabsScreenProps<RootTabName.Sermons>> = () => (
  <SermonsStack.Navigator
    initialRouteName={SermonsStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <SermonsStack.Screen name={SermonsStackParamName.Home} component={HomeScreen} />
  </SermonsStack.Navigator>
);
