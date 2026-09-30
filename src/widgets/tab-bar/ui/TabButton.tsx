import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableButton } from 'shared/ui/touchable-button'
import { styles } from './styles'
import { TabIcon } from './TabIcon'
import { getTabLabel } from './tabLabels'

export const TabButton = ({
  isActive,
  isDisabled,
  onPress,
  routeKey,
  routeName,
}: {
  isActive: boolean
  isDisabled?: boolean
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
