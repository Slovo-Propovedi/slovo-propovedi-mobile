import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import type { ColorValue } from 'react-native'

// A reloaded web page has no navigation history, so react-navigation's own
// back button never appears. This one always works, falling back to the
// "More" tab (the parent of every sub-screen) when there is nowhere to go back to.
const FALLBACK_ROUTE = '/more'

interface HeaderBackButtonProps {
  tintColor?: ColorValue
}

export const HeaderBackButton = ({ tintColor }: HeaderBackButtonProps) => {
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(FALLBACK_ROUTE)
  }

  return (
    <Pressable
      hitSlop={8}
      onPress={handlePress}
      style={styles.container}
      accessibilityRole='button'
      accessibilityLabel='Назад'
    >
      <Ionicons size={24} color={tintColor} name='chevron-back' />
      <Text style={[styles.text, { color: tintColor }]}>Назад</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 17,
  },
})
