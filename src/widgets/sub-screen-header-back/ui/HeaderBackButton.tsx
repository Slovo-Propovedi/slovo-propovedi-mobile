import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'
import type { Href } from 'expo-router'
import type { ColorValue } from 'react-native'

// A reloaded web page has no navigation history, so react-navigation's own
// back button never appears. This one always works, falling back to
// `fallbackRoute` (the parent of the sub-screen) when there is nowhere to go back to.
const DEFAULT_FALLBACK_ROUTE = '/more'

interface HeaderBackButtonProps {
  fallbackRoute?: Href
  tintColor?: ColorValue
}

export const HeaderBackButton = ({
  fallbackRoute = DEFAULT_FALLBACK_ROUTE,
  tintColor,
}: HeaderBackButtonProps) => {
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(fallbackRoute)
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
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
})
