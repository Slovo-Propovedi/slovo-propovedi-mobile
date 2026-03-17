import { Stack } from 'expo-router'

const AudioPlayerLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
      presentation: 'modal',
    }}
  >
    <Stack.Screen name='audio-player' />
  </Stack>
)

export default AudioPlayerLayout
