import Ionicons from '@expo/vector-icons/Ionicons'
import { useContext } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useHasFinePointer } from '../../lib/hooks/useHasFinePointer'
import { IconButton } from '../icon-button/IconButton'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { MIN_TOUCH_TARGET } from '../theme/themed'
import { RefreshContext } from './refreshContext'

const ICON_SIZE = 24

/**
 * Header refresh button for desktop web: a mouse cannot pull to refresh, so the
 * screen's `PullToRefresh` reload is offered as a button. Renders nothing on
 * touch devices (phones, tablets) and outside a `PullToRefresh`.
 */
export const RefreshButton = () => {
  const context = useContext(RefreshContext)
  const hasFinePointer = useHasFinePointer()
  const { currentTheme } = useTheme()

  if (!context || !hasFinePointer) return null

  if (context.refreshing)
    return (
      <View style={styles.spinner}>
        <ActivityIndicator color={currentTheme.primary} />
      </View>
    )

  return (
    <IconButton
      accessibilityLabel='Обновить'
      onPress={() => void context.onRefresh()}
      Icon={<Ionicons size={ICON_SIZE} name='refresh-outline' color={currentTheme.primary} />}
    />
  )
}

const styles = StyleSheet.create({
  spinner: {
    alignItems: 'center',
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    width: MIN_TOUCH_TARGET,
  },
})
