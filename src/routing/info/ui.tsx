import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Info } from 'pages/info';
import { RootTabsScreenProps, RootTabName } from 'shared';
import { InfoStackParamList, InfoStackParamName } from './types';

const InfoStack = createNativeStackNavigator<InfoStackParamList>();

export const InfoRouting: React.FC<RootTabsScreenProps<RootTabName.Info>> = () => (
  <InfoStack.Navigator
    initialRouteName={InfoStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <InfoStack.Screen name={InfoStackParamName.Home} component={Info} />
  </InfoStack.Navigator>
);
