import { Stack } from 'expo-router'
import { useTheme } from 'shared/ui/themed'

const ListenStackLayout = () => {
  const { currentTheme } = useTheme()
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerBackTitle: 'Назад',
        headerStyle: { backgroundColor: currentTheme.background },
        headerTintColor: currentTheme.text,
        headerTitleStyle: { color: currentTheme.text },
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
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        title: 'Плейлист',
      }}
    />
    </Stack>
  )
}

export default ListenStackLayout
