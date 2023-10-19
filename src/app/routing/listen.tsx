import { AntDesign } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { AudioPlayerScreen } from 'pages/audio-player';
import { ListenScreen } from 'pages/listen';
import { PlaylistScreen } from 'pages/playlist';
import { PlaylistListScreen } from 'pages/playlist-list';
import type { ListenStackParamList, RootTabName, RootTabsScreenProps } from 'shared';
import { COLORS, ListenStackParamName } from 'shared';

const ListenStack = createNativeStackNavigator<ListenStackParamList>();

export const ListenRouting: React.FC<RootTabsScreenProps<RootTabName.Listen>> = ({
  navigation: { goBack },
}) => (
  <ListenStack.Navigator
    initialRouteName={ListenStackParamName.ListenHome}
    screenOptions={{
      headerLeft: ({ canGoBack, tintColor }) => (
        <TouchableOpacity onPress={() => canGoBack && goBack()}>
          <AntDesign color={tintColor} name='leftcircle' size={24} />
        </TouchableOpacity>
      ),
      headerTintColor: COLORS.primary,
      headerTitle: '',
      headerTransparent: true,
    }}
  >
    <ListenStack.Screen
      component={ListenScreen}
      name={ListenStackParamName.ListenHome}
      options={() => ({
        headerShown: false,
      })}
    />
    <ListenStack.Screen component={PlaylistListScreen} name={ListenStackParamName.PlaylistList} />
    <ListenStack.Screen component={PlaylistScreen} name={ListenStackParamName.Playlist} />
    <ListenStack.Screen component={AudioPlayerScreen} name={ListenStackParamName.AudioPlayer} />
  </ListenStack.Navigator>
);
