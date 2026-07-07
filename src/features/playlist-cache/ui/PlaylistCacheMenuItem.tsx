import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'

const ICON_SIZE = 18

export interface PlaylistCacheMenuItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor?: string
  isDisabled?: boolean
  onPress: () => void
  text: string
  textColor?: string
}

export const PlaylistCacheMenuItem = ({
  icon,
  iconColor,
  isDisabled = false,
  onPress,
  text,
  textColor,
}: PlaylistCacheMenuItemProps) => {
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
        color={iconColor || (isDisabled ? COLORS.textMuted : COLORS.icon)}
      />
      <Text
        style={[
          styles.dropdownItemText,
          isDisabled && styles.dropdownItemTextDisabled,
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
  dropdownItemText: { color: COLORS.text, fontSize: FONT_SIZES.base },
  dropdownItemTextDisabled: { color: COLORS.textMuted },
})
