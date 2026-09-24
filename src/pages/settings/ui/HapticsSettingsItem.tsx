import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { Checkbox } from 'expo-checkbox'
import { StyleSheet, Text, View } from 'react-native'
import { hapticsEnabledAtom, setHapticsEnabled } from 'shared/model'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface HapticsSettingsItemProps {
  style?: StyleProp<ViewStyle>
}

export const HapticsSettingsItem = ({ style }: HapticsSettingsItemProps) => {
  const [enabled] = useAtom(hapticsEnabledAtom)
  const setEnabled = useAction(setHapticsEnabled)
  const { currentTheme } = useTheme()

  const handleToggle = () => {
    setEnabled(!enabled)
  }

  return (
    <TouchableItem
      onPress={handleToggle}
      style={[styles.container, { backgroundColor: currentTheme.surface }, style]}
    >
      <View style={styles.content}>
        <Ionicons
          size={24}
          style={styles.icon}
          color={currentTheme.text}
          name='phone-portrait-outline'
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Виброотклик</Text>
          <Text style={[styles.description, { color: currentTheme.textMuted }]}>
            Вибрация при перемотке и нажатиях
          </Text>
        </View>
        <Checkbox
          value={enabled}
          style={styles.checkbox}
          onValueChange={handleToggle}
          color={enabled ? currentTheme.primary : undefined}
        />
      </View>
    </TouchableItem>
  )
}

const styles = StyleSheet.create({
  checkbox: {
    borderRadius: 4,
    height: 22,
    width: 22,
  },
  container: {
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
    fontSize: FONT_SIZES.base,
  },
})
