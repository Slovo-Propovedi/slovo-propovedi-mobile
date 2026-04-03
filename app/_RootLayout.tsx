import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAtom } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { isPlayingAtom, positionAtom } from 'entities/player'
import { CURRENT_SOUND_POSITION } from 'shared/config'

const RootLayout = () => {
  const [isPlaying] = useAtom(isPlayingAtom)
  const [position] = useAtom(positionAtom)

  useEffect(() => {
    const savePosition = async () => {
      if (!isPlaying) await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
    }
    const interval = setInterval(savePosition, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, position])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  )
}

export default RootLayout
