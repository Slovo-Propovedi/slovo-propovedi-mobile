import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { HomeScreen } from 'pages/home';
import { RootTabName, RootTabsScreenProps } from 'shared';
import { MainStackParamList } from './types';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainRouting: FC<RootTabsScreenProps<RootTabName.Sermons>> = () => (
  <MainStack.Navigator
    initialRouteName='Home'
    screenOptions={{
      headerShown: false,
    }}
  >
    <MainStack.Screen name='Home' component={HomeScreen} />
  </MainStack.Navigator>
);
