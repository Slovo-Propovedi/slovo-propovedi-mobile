import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FC } from 'react';
import { Library } from 'pages';
import { RootTabsScreenProps, RootTabName } from 'shared';
import { LibraryStackParamList, LibraryStackParamName } from './types';

const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();

export const LibraryRouting: FC<RootTabsScreenProps<RootTabName.Library>> = () => (
  <LibraryStack.Navigator
    initialRouteName={LibraryStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <LibraryStack.Screen name={LibraryStackParamName.Home} component={Library} />
  </LibraryStack.Navigator>
);
