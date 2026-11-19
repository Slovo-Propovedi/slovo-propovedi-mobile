import { Stack } from 'expo-router'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const SEARCH_FALLBACK_ROUTE = '/search'

const SearchStackLayout = () => {
  const { currentTheme } = useTheme()

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerLeft: props => (
          <HeaderBackButton tintColor={props.tintColor} fallbackRoute={SEARCH_FALLBACK_ROUTE} />
        ),
        headerStyle: { backgroundColor: currentTheme.background },
        headerTintColor: currentTheme.text,
        headerTitleStyle: { color: currentTheme.text },
      }}
    >
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen
        name='playlist'
        options={{
          headerStyle: { backgroundColor: 'transparent' },
          headerTransparent: true,
          title: '',
        }}
      />
      <Stack.Screen name='preacher' options={{ title: '' }} />
    </Stack>
  )
}

export default SearchStackLayout
