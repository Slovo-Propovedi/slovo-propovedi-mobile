import { Text, View } from 'react-native'
import { sermonSubtitle } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { SermonBadges } from './SermonBadges'
import { styles } from './styles'

// Карточка проповеди в списке админки: обложка, название, подпись
// (проповедник · ссылка на Писание) и бейджи наличия медиа.
export const AdminSermonRow = ({
  item,
  onPress,
}: {
  item: APITypes.SermonEntity
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()
  const subtitle = sermonSubtitle(item)

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <View style={styles.rowHeader}>
        <CoverImage uri={item.artwork} style={styles.artwork} imageStyle={styles.artwork} />
        <View style={styles.rowBody}>
          <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
            {item.title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <SermonBadges
        hasAudio={Boolean(item.audioUrl)}
        hasText={Boolean(item.textFileUrl)}
        hasYoutube={Boolean(item.youtubeUrl)}
      />
    </TouchableItem>
  )
}
