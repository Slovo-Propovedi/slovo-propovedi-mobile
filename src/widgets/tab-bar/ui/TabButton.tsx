import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { styles } from './styles'
import { TabIcon } from './TabIcon'
import { getTabLabel } from './tabLabels'

export const TabButton = ({
  isActive,
  isDisabled,
  onLayout,
  onPress,
  routeKey,
  routeName,
}: {
  isActive: boolean
  isDisabled?: boolean
  onLayout: (layout: { width: number; x: number }) => void
  onPress: () => void
  routeKey: string
  routeName: string
}) => {
  const { currentTheme } = useTheme()
  const color = isActive ? currentTheme.primary : currentTheme.textMuted

  return (
    <TouchableButton
      key={routeKey}
      onPress={onPress}
      hapticDisabled={isActive}
      activeOpacity={isActive ? 1 : undefined}
      style={[styles.tabButton, isDisabled && styles.disabledTabButton]}
      onLayout={e =>
        onLayout({
          width: e.nativeEvent.layout.width,
          x: e.nativeEvent.layout.x,
        })
      }
    >
      <View style={styles.tabItem}>
        <TabIcon color={color} isActive={isActive} routeName={routeName} />
        <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={[styles.tabText, { color }]}>
          {getTabLabel(routeName)}
        </Text>
      </View>
    </TouchableButton>
  )
}
