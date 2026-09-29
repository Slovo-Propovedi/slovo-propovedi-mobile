import Ionicons from '@expo/vector-icons/Ionicons'
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'

export const LinkButton = ({
  icon,
  onPress,
  style,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  title: string
}) => {
  const { currentTheme } = useTheme()
  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.linkButton, { backgroundColor: currentTheme.surface }, style]}
    >
      <View style={styles.linkButtonContent}>
        <Ionicons
          size={24}
          name={icon}
          color={currentTheme.primary}
          style={styles.linkButtonIcon}
        />
        <Text style={[styles.linkButtonText, { color: currentTheme.text }]}>{title}</Text>
        <Ionicons
          size={20}
          name='open-outline'
          color={currentTheme.primary}
          style={{ marginLeft: 'auto' }}
        />
      </View>
    </TouchableItem>
  )
}

const styles = StyleSheet.create({
  linkButton: { borderRadius: RADIUSES.low },
  linkButtonContent: { alignItems: 'center', flexDirection: 'row', padding: INDENTS.high },
  linkButtonIcon: { marginRight: INDENTS.medium },
  linkButtonText: { fontSize: 16 },
})
