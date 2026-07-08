import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { Checkbox } from 'expo-checkbox'
import { StyleSheet, Text, View } from 'react-native'
import { dynamicColorsEnabledAtom, setDynamicColors } from 'shared/ui/theme'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface DynamicColorsItemProps {
  style?: StyleProp<ViewStyle>
  testID?: string
}

export const DynamicColorsItem = ({ style, testID }: DynamicColorsItemProps) => {
  const [enabled] = useAtom(dynamicColorsEnabledAtom)
  const setEnabled = useAction(setDynamicColors)
  const { currentTheme } = useTheme()

  const handleToggle = () => {
    setEnabled(!enabled)
  }

  return (
    <TouchableItem
      testID={testID}
      onPress={handleToggle}
      style={[styles.container, { backgroundColor: currentTheme.surface }, style]}
    >
      <View style={styles.content}>
        <Ionicons
          size={24}
          style={styles.icon}
          name='color-wand-outline'
          color={currentTheme.text}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Динамические цвета</Text>
          <Text style={[styles.description, { color: currentTheme.textMuted }]}>
            Цвета подстраиваются под обои (Material You)
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

export default DynamicColorsItem
