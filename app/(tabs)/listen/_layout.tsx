import { Stack } from 'expo-router'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { HelpHeaderButton } from 'features/onboarding'
import { useTheme } from 'shared/ui/theme'

const LISTEN_FALLBACK_ROUTE = '/listen'

const renderHelp = (props: { tintColor?: ColorValue }) => (
  <HelpHeaderButton tintColor={props.tintColor} />
)

const ListenStackLayout = () => {
  const { currentTheme } = useTheme()
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerLeft: props => (
          <HeaderBackButton tintColor={props.tintColor} fallbackRoute={LISTEN_FALLBACK_ROUTE} />
        ),
        headerRight: renderHelp,
        headerStyle: { backgroundColor: currentTheme.background },
        headerTintColor: currentTheme.text,
        headerTitleStyle: { color: currentTheme.text },
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen
        name='my-playlists'
        options={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          title: '',
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
      <Stack.Screen name='preacher' options={{ title: '' }} />
      <Stack.Screen
        name='playlist'
        options={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          title: '',
        }}
      />
      <Stack.Screen name='playlist-edit' options={{ title: 'Редактировать плейлист' }} />
    </Stack>
  )
}

export default ListenStackLayout
