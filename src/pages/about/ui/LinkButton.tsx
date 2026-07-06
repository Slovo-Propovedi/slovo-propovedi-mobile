import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, INDENTS, RADIUSES } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface LinkButtonProps {
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  title: string
}

export const LinkButton = ({ icon, onPress, style, testID, title }: LinkButtonProps) => (
  <TouchableItem testID={testID} onPress={onPress} style={[styles.linkButton, style]}>
    <View style={styles.linkButtonContent}>
      <Ionicons size={24} name={icon} color={COLORS.primary} style={styles.linkButtonIcon} />
      <Text style={styles.linkButtonText}>{title}</Text>
      <Ionicons
        size={20}
        name='open-outline'
        color={COLORS.primary}
        style={{ marginLeft: 'auto' }}
      />
    </View>
  </TouchableItem>
)

const styles = StyleSheet.create({
  linkButton: { backgroundColor: COLORS.surface, borderRadius: RADIUSES.low },
  linkButtonContent: { alignItems: 'center', flexDirection: 'row', padding: INDENTS.high },
  linkButtonIcon: { marginRight: INDENTS.medium },
  linkButtonText: { color: COLORS.text, fontSize: 16 },
})
