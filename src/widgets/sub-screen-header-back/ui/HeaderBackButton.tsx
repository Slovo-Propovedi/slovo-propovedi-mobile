import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, router } from 'expo-router'
import { type ColorValue, StyleSheet } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'

// A reloaded web page has no navigation history, so react-navigation's own
// back button never appears. This one always works, falling back to
// `fallbackRoute` (the parent of the sub-screen) when there is nowhere to go back to.
const DEFAULT_FALLBACK_ROUTE = '/more'

export const HeaderBackButton = ({
  fallbackRoute = DEFAULT_FALLBACK_ROUTE,
  onPress,
  tintColor,
}: {
  fallbackRoute?: Href
  onPress?: () => void
  tintColor?: ColorValue
}) => {
  const handlePress = () => {
    // Экраны проповедей передают свой «назад», который гарантированно остаётся
    // в /admin (см. useSermonScreens): headerLeft из Stack.Screen перекрывает
    // options вложенного экрана, поэтому back-кнопка живёт здесь.
    if (onPress) {
      onPress()
      return
    }

    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(fallbackRoute)
  }

  return (
    <IconButton
      onPress={handlePress}
      style={styles.container}
      accessibilityLabel='Назад'
      Icon={<Ionicons size={24} color={tintColor} name='chevron-back' />}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    marginLeft: -8,
    width: 48,
  },
})
