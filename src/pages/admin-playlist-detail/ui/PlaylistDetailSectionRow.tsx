import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Строка раздела в детали плейлиста: название и число плейлистов.
// Тап открывает деталь раздела внутри админки.
export const PlaylistDetailSectionRow = ({
  onPress,
  section,
}: {
  onPress: () => void
  section: APITypes.SectionEntity
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
          {section.title}
        </Text>
        <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
          {`${section.playlists.length} плейлистов`}
        </Text>
      </View>
    </TouchableItem>
  )
}
