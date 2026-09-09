import { MaterialCommunityIcons } from '@expo/vector-icons'
import { type ColorValue } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { PlaylistMenuRow } from './PlaylistMenuRow'

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

  return (
    <PlaylistMenuRow
      text={text}
      onPress={onPress}
      textColor={textColor}
      isDisabled={isDisabled}
      icon={
        <MaterialCommunityIcons
          name={icon}
          size={ICON_SIZE}
          color={iconColor || (isDisabled ? currentTheme.textMuted : currentTheme.icon)}
        />
      }
    />
  )
}
