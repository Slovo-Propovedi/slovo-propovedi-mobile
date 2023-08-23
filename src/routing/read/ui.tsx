import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ReadScreen } from 'pages';
import { RootTabsScreenProps, RootTabName } from 'shared';
import { ReadStackParamList, ReadStackParamName } from './types';

const ReadStack = createNativeStackNavigator<ReadStackParamList>();

export const ReadRouting: React.FC<RootTabsScreenProps<RootTabName.Read>> = () => (
  <ReadStack.Navigator
    initialRouteName={ReadStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <ReadStack.Screen name={ReadStackParamName.Home} component={ReadScreen} />
  </ReadStack.Navigator>
);
