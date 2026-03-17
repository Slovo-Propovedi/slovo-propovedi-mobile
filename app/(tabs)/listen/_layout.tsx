import { Stack } from 'expo-router'
import { COLORS } from 'shared/themed'

const ListenStackLayout = () => (
  <Stack
    screenOptions={{
      headerBackTitle: 'Назад',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen
      name='index'
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen
      name='playlist-list'
      options={{
        title: 'Плейлисты',
      }}
    />
    <Stack.Screen
      name='playlist'
      options={{
        title: 'Плейлист',
      }}
    />
  </Stack>
)

export default ListenStackLayout
