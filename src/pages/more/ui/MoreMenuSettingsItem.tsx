import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'
import { styles } from './styles'

interface MoreMenuSettingsItemProps {
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  title: string
}

export const MoreMenuSettingsItem = ({
  description,
  icon,
  onPress,
  style,
  testID,
  title,
}: MoreMenuSettingsItemProps) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      testID={testID}
      onPress={onPress}
      style={[styles.itemContainer, { backgroundColor: currentTheme.surface }, style]}
    >
      <View style={styles.itemContent}>
        {icon && (
          <Ionicons size={24} name={icon} style={styles.itemIcon} color={currentTheme.text} />
        )}
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemTitle, { color: currentTheme.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.itemDescription, { color: currentTheme.textMuted }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </TouchableItem>
  )
}
