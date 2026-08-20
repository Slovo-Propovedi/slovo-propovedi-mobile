import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface LinkButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  title: string
}

export const LinkButton = ({ icon, onPress, style, testID, title }: LinkButtonProps) => {
  const { currentTheme } = useTheme()
  return (
    <TouchableItem
      testID={testID}
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
