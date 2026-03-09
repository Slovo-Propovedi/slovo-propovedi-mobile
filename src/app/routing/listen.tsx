import { AntDesign } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { TouchableOpacity } from 'react-native'
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

const HeaderBackButton = ({ canGoBack, tintColor }: { canGoBack: boolean; tintColor: string }) => {
  const navigation = useNavigation()

  if (!canGoBack) return null

  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <AntDesign size={24} color={tintColor} name='left-circle' />
    </TouchableOpacity>
  )
}

export const ListenRouting: React.FC<RootTabsScreenProps<RootTabName.Listen>> = () => (
  <ListenStack.Navigator
    initialRouteName={ListenStackParamName.ListenHome}
    screenOptions={{
      headerLeft: ({ canGoBack, tintColor }) => (
        <HeaderBackButton canGoBack={canGoBack ?? false} tintColor={tintColor ?? COLORS.primary} />
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
  </ListenStack.Navigator>
)
