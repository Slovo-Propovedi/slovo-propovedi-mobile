import { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { type ColorValue } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'

export interface PlaylistMenuRowProps {
  icon: ReactNode
  isDisabled?: boolean
  onPress: () => void
  text: string
  textColor?: ColorValue
}

export const PlaylistMenuRow = ({
  icon,
  isDisabled = false,
  onPress,
  text,
  textColor,
}: PlaylistMenuRowProps) => {
  const { currentTheme } = useTheme()
  const handlePress = () => {
    if (isDisabled) return
    onPress()
  }

  return (
    <View
      onTouchEnd={handlePress}
      style={[styles.dropdownItem, isDisabled && styles.dropdownItemDisabled]}
    >
      <View style={styles.dropdownIcon}>{icon}</View>
      <Text
        style={[
          styles.dropdownItemText,
          { color: isDisabled ? currentTheme.textMuted : currentTheme.text },
          textColor && { color: textColor },
        ]}
      >
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownIcon: { marginRight: INDENTS.low },
  dropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  dropdownItemDisabled: { opacity: 0.5 },
  dropdownItemText: { fontSize: FONT_SIZES.base },
})
