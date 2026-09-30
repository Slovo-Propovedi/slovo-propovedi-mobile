import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { CoverImage } from 'shared/ui'
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

// Шапка детали плейлиста: обложка, название, описание, счётчик и удаление.
// «Редактировать» живёт в шапке экрана (headerRight), не в теле.
export const PlaylistDetailHeader = ({
  onDelete,
  playlist,
  sermonsCount,
}: {
  onDelete: () => void
  playlist: APITypes.PlaylistEntity
  sermonsCount: number
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <CoverImage eager uri={playlist.artwork} style={styles.artwork} imageStyle={styles.artwork} />
      <Text style={[styles.title, { color: currentTheme.text }]}>{playlist.title}</Text>
      {playlist.description ? (
        <Text style={[styles.description, { color: currentTheme.textMuted }]}>
          {playlist.description}
        </Text>
      ) : null}
      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>Проповеди</Text>
          <Text style={[styles.statValue, { color: currentTheme.text }]}>
            {`${sermonsCount} ${pluralize(sermonsCount, ['проповедь', 'проповеди', 'проповедей'])}`}
          </Text>
        </View>
        <View style={[styles.stat, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>Разделы</Text>
          <Text style={[styles.statValue, { color: currentTheme.text }]}>
            {String(playlist.sections.length)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableItem
          onPress={onDelete}
          style={[styles.actionButton, { backgroundColor: currentTheme.surface }]}
        >
          <Ionicons size={18} name='trash-outline' color={currentTheme.textMuted} />
          <Text style={[styles.actionText, { color: currentTheme.textMuted }]}>Удалить</Text>
        </TouchableItem>
      </View>
    </View>
  )
}
