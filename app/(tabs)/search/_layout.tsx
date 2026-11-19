import { Stack } from 'expo-router'
import { useTheme } from 'shared/ui/theme'

const SearchStackLayout = () => {
  const { currentTheme } = useTheme()

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='playlist' />
      <Stack.Screen name='preacher' />
    </Stack>
  )
}

export default SearchStackLayout
