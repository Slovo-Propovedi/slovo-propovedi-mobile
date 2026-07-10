import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { type ThemeColors, ThemeMode } from 'shared/ui/theme'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { ThemeSelectorOption as ThemeSelectorOptionData } from './themeOptions'

export interface ThemeSelectorOptionProps {
  currentTheme: ThemeColors
  isSelected: boolean
  onPress: () => void
  option: ThemeSelectorOptionData
}

export const ThemeSelectorOption = ({
  currentTheme,
  isSelected,
  onPress,
  option,
}: ThemeSelectorOptionProps) => (
  <TouchableItem
    onPress={onPress}
    testID={`theme-option-${option.value}`}
    style={[
      styles.optionContainer,
      {
        backgroundColor: currentTheme.surface,
        borderColor: isSelected ? currentTheme.primary : 'transparent',
      },
    ]}
  >
    <View style={styles.optionContent}>
      <Ionicons size={24} name={option.icon} color={currentTheme.text} style={styles.optionIcon} />
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionLabel, { color: currentTheme.text }]}>{option.label}</Text>
        {option.value === ThemeMode.System && (
          <Text style={[styles.optionDescription, { color: currentTheme.textMuted }]}>
            Автоматически переключается в зависимости от настроек системы
          </Text>
        )}
      </View>
      <View
        style={[
          styles.radioOuter,
          {
            borderColor: isSelected ? currentTheme.primary : currentTheme.textMuted,
          },
        ]}
      >
        {isSelected && (
          <View style={[styles.radioInner, { backgroundColor: currentTheme.primary }]} />
        )}
      </View>
    </View>
  </TouchableItem>
)

const styles = StyleSheet.create({
  optionContainer: {
    borderBottomWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.high,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  optionIcon: {
    marginRight: INDENTS.medium,
  },
  optionLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  optionTextContainer: {
    flex: 1,
  },
  radioInner: {
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: COLORS.textMuted,
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
})
