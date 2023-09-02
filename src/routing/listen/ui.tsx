import { AntDesign } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { PlaylistScreen, ListenScreen, AudioPlayerScreen } from 'pages';
import { PlaylistListScreen } from 'pages/playlist-list';
import { COLORS, RootTabName, RootTabsScreenProps } from 'shared';
import { ListenStackParamList, ListenStackParamName } from './types';

const ListenStack = createNativeStackNavigator<ListenStackParamList>();

export const ListenRouting: React.FC<RootTabsScreenProps<RootTabName.Listen>> = ({
  navigation: { goBack },
}) => (
  <ListenStack.Navigator
    initialRouteName={ListenStackParamName.ListenHome}
    screenOptions={{
      headerLeft: ({ canGoBack, tintColor }) => (
        <TouchableOpacity onPress={() => canGoBack && goBack()}>
          <AntDesign name='leftcircle' size={24} color={tintColor} />
        </TouchableOpacity>
      ),
      headerTransparent: true,
      headerTintColor: COLORS.primary,
      headerTitle: '',
    }}
  >
    <ListenStack.Screen
      name={ListenStackParamName.ListenHome}
      component={ListenScreen}
      options={() => ({
        headerShown: false,
      })}
    />
    <ListenStack.Screen name={ListenStackParamName.PlaylistList} component={PlaylistListScreen} />
    <ListenStack.Screen name={ListenStackParamName.Playlist} component={PlaylistScreen} />
    <ListenStack.Screen name={ListenStackParamName.AudioPlayer} component={AudioPlayerScreen} />
  </ListenStack.Navigator>
);
