import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { Info } from 'pages/info';
import { RootTabsScreenProps, RootTabName } from 'shared';
import { InfoStackParamList, InfoStackParamName } from './types';

const InfoStack = createNativeStackNavigator<InfoStackParamList>();

export const InfoRouting: FC<RootTabsScreenProps<RootTabName.Info>> = () => (
  <InfoStack.Navigator
    initialRouteName={InfoStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <InfoStack.Screen name={InfoStackParamName.Home} component={Info} />
  </InfoStack.Navigator>
);
