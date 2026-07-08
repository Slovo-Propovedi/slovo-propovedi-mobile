import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { type ColorValue } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'

const ICON_SIZE = 18

export interface PlaylistCacheMenuItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: ColorValue
  isDisabled?: boolean
  onPress: () => void
  text: string
  textColor?: ColorValue
}

export const PlaylistCacheMenuItem = ({
  icon,
  iconColor,
  isDisabled = false,
  onPress,
  text,
  textColor,
}: PlaylistCacheMenuItemProps) => {
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
      <MaterialCommunityIcons
        name={icon}
        size={ICON_SIZE}
        style={styles.dropdownIcon}
        color={iconColor || (isDisabled ? currentTheme.textMuted : currentTheme.icon)}
      />
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

export default PlaylistCacheMenuItem

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
