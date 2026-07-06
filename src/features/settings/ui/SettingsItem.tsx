import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface SettingsItemProps {
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  title: string
}

export const SettingsItem = ({
  description,
  icon,
  onPress,
  style,
  testID,
  title,
}: SettingsItemProps) => (
  <TouchableItem testID={testID} onPress={onPress} style={[styles.container, style]}>
    <View style={styles.content}>
      {icon && <Ionicons size={24} name={icon} color={COLORS.text} style={styles.icon} />}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
  </TouchableItem>
)

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  icon: {
    marginRight: INDENTS.medium,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
})
