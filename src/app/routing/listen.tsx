import { AntDesign } from '@expo/vector-icons'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { AudioPlayerScreen } from 'pages/audio-player'
import { ListenScreen } from 'pages/listen'
import { PlaylistScreen } from 'pages/playlist'
import { PlaylistListScreen } from 'pages/playlist-list'
import {
  type ListenStackParamList,
  ListenStackParamName,
  type RootTabName,
  type RootTabsScreenProps,
} from 'shared/routing'
import { COLORS } from 'shared/themed'

const ListenStack = createNativeStackNavigator<ListenStackParamList>()

export const ListenRouting: React.FC<RootTabsScreenProps<RootTabName.Listen>> = ({
  navigation: { goBack },
}) => (
  <ListenStack.Navigator
    initialRouteName={ListenStackParamName.ListenHome}
    screenOptions={{
      headerLeft: ({ canGoBack, tintColor }) => (
        <TouchableOpacity onPress={() => canGoBack && goBack()}>
          <AntDesign size={24} color={tintColor} name='left-circle' />
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
)
