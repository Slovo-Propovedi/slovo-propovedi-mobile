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
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          title: '',
        }}
      />
      <Stack.Screen
        name='playlist'
        options={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          title: '',
        }}
      />
    </Stack>
  )
}

export default ListenStackLayout
