import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { MovingText } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { AdminSectionBadges } from './AdminSectionBadges'
import { styles } from './styles'

const DRAG_LABEL = 'Переместить раздел'

const playlistCountLabel = (count: number) => `${count} ${pluralizePlaylists(count)}`

const pluralizePlaylists = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'плейлист'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'плейлиста'
  return 'плейлистов'
}

// Строка раздела в списке админки: тап открывает деталь, ручка запускает drag.
export const AdminSectionRow = ({
  drag,
  isActive,
  item,
  onPress,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.SectionEntity
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()
  const subtitle = item.description ?? playlistCountLabel(item.playlists.length)

  return (
    <TouchableItem
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: currentTheme.surface,
          borderColor: isActive ? currentTheme.primary : 'transparent',
          opacity: isActive ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.rowBody}>
        <MovingText text={item.title} style={styles.rowTitle} />
        <Text numberOfLines={1} style={[styles.rowSubtitle, { color: currentTheme.textMuted }]}>
          {subtitle}
        </Text>
        <AdminSectionBadges itemsSize={item.itemsSize} transform={item.transform} />
      </View>
      <IconButton
        onPressIn={drag}
        accessibilityLabel={DRAG_LABEL}
        Icon={<Ionicons size={26} name='reorder-three' color={currentTheme.textMuted} />}
      />
    </TouchableItem>
  )
}
