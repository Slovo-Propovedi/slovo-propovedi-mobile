import { Ionicons } from '@expo/vector-icons'
import { useTheme } from 'shared/ui/theme'
import { PlaylistMenuRow } from './PlaylistMenuRow'

const ICON_SIZE = 18
const SHARE_ICON = 'share-outline'

export const SHARE_TEXT = 'Поделиться плейлистом'

export interface PlaylistShareMenuItemProps {
  isDisabled?: boolean
  onPress: () => void
  text: string
}

export const PlaylistShareMenuItem = ({
  isDisabled = false,
  onPress,
  text,
}: PlaylistShareMenuItemProps) => {
  const { currentTheme } = useTheme()

  return (
    <PlaylistMenuRow
      text={text}
      onPress={onPress}
      isDisabled={isDisabled}
      icon={<Ionicons size={ICON_SIZE} name={SHARE_ICON} color={currentTheme.icon} />}
    />
  )
}
