import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { CoverImage, MovingText } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const pluralize = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]

  return forms[2]
}

const metaLabel = (sermons: number, sections: number) =>
  [
    `${sermons} ${pluralize(sermons, ['проповедь', 'проповеди', 'проповедей'])}`,
    `${sections} ${pluralize(sections, ['раздел', 'раздела', 'разделов'])}`,
  ].join(' · ')

// Карточка плейлиста в списке админки: обложка, название и счётчики связей.
export const AdminPlaylistRow = ({
  item,
  onPress,
}: {
  item: APITypes.PlaylistEntity
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <CoverImage uri={item.artwork} style={styles.artwork} imageStyle={styles.artwork} />
      <View style={styles.rowBody}>
        <MovingText text={item.title} style={styles.rowTitle} />
        <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
          {metaLabel(item.sermons.length, item.sections.length)}
        </Text>
      </View>
    </TouchableItem>
  )
}
