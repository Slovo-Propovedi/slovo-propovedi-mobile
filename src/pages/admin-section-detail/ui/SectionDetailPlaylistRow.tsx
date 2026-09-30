import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { MovingText } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const DRAG_LABEL = 'Переместить плейлист'

// Строка плейлиста в детали раздела: тап открывает плейлист, ручка — drag.
export const SectionDetailPlaylistRow = ({
  drag,
  isActive,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.SectionPlaylist
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[
        styles.playlistRow,
        {
          backgroundColor: currentTheme.surface,
          borderColor: isActive ? currentTheme.primary : 'transparent',
          opacity: isActive ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.playlistBody}>
        <MovingText text={item.title} style={styles.playlistTitle} />
        <Text style={[styles.playlistSubtitle, { color: currentTheme.textMuted }]}>
          {item.sermons.length} проповедей
        </Text>
      </View>
      <IconButton
        onPressIn={drag}
        accessibilityLabel={DRAG_LABEL}
        Icon={<Ionicons size={26} name='reorder-three' color={currentTheme.textMuted} />}
      />
    </TouchableItem>
  )
}
