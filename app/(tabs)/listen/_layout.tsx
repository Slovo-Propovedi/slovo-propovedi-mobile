import { Stack } from 'expo-router'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const LISTEN_FALLBACK_ROUTE = '/listen'

const ListenStackLayout = () => {
  const { currentTheme } = useTheme()
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerLeft: props => (
          <HeaderBackButton tintColor={props.tintColor} fallbackRoute={LISTEN_FALLBACK_ROUTE} />
        ),
        headerStyle: { backgroundColor: currentTheme.background },
        headerTintColor: currentTheme.text,
        headerTitleStyle: { color: currentTheme.text },
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: false }} />
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
