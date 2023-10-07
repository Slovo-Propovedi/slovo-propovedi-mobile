import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ReadScreen } from 'pages/read';
import { RootTabsScreenProps, RootTabName, ReadStackParamList, ReadStackParamName } from 'shared';

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
