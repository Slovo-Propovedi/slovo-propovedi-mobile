import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { BibleSchool } from 'pages';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { BibleSchoolStackParamList, BibleSchoolStackParamName } from './types';

const BibleSchoolStack = createNativeStackNavigator<BibleSchoolStackParamList>();

export const BibleSchoolRouting: FC<RootTabsScreenProps<RootTabName.BibleSchool>> = () => (
  <BibleSchoolStack.Navigator
    initialRouteName={BibleSchoolStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <BibleSchoolStack.Screen name={BibleSchoolStackParamName.Home} component={BibleSchool} />
  </BibleSchoolStack.Navigator>
);
