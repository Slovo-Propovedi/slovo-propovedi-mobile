import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StudyScreen } from 'pages/study';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { StudyStackParamList, StudyStackParamName } from './types';

const StudyStack = createNativeStackNavigator<StudyStackParamList>();

export const StudyRouting: React.FC<RootTabsScreenProps<RootTabName.Study>> = () => (
  <StudyStack.Navigator
    initialRouteName={StudyStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <StudyStack.Screen name={StudyStackParamName.Home} component={StudyScreen} />
  </StudyStack.Navigator>
);
