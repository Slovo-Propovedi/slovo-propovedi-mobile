import { Stack } from 'expo-router'

const ReadLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name='book-reader' />
    <Stack.Screen
      name='books-list'
      options={{
        headerShown: true,
      }}
    />
  </Stack>
)

export default ReadLayout
