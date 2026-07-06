import { Stack } from 'expo-router'
import { COLORS } from 'shared/ui/themed'

const MoreStackLayout = () => (
  <Stack
    screenOptions={{
      headerBackTitle: 'Назад',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen
      name='settings'
      options={{ title: 'Настройки' }}
    />
  </Stack>
)

export default MoreStackLayout
