import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { HomeScreen } from 'pages/home';
import { Info } from 'pages/info';
import { InfoStackParamList, MainStackParamList, RootTabName, RootTabsScreenProps } from 'shared';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainRouting: FC<RootTabsScreenProps<RootTabName.Main>> = () => (
  <MainStack.Navigator
    initialRouteName='Home'
    screenOptions={{
      headerShown: false,
    }}
  >
    <MainStack.Screen name='Home' component={HomeScreen} />
  </MainStack.Navigator>
);

const InfoStack = createNativeStackNavigator<InfoStackParamList>();

export const InfoRouting: FC<RootTabsScreenProps<RootTabName.Info>> = () => (
  <InfoStack.Navigator
    initialRouteName='Home'
    screenOptions={{
      headerShown: false,
    }}
  >
    <InfoStack.Screen name='Home' component={Info} />
  </InfoStack.Navigator>
);
