import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { formatSermonReference } from 'entities/sermon'
import { type APITypes } from 'shared/api'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const DRAG_LABEL = 'Переместить проповедь'

// Строка проповеди в детали плейлиста: название, подпись и ручка drag.
// Тап по строке ничего не открывает (экрана проповеди в админке ещё нет),
// поэтому строка — обычный View, а не кнопка.
export const PlaylistDetailSermonRow = ({
  drag,
  isActive,
  item,
}: {
  drag: () => void
  isActive: boolean
  item: APITypes.PlaylistSermon
}) => {
  const { currentTheme } = useTheme()
  const reference = formatSermonReference({
    book: item.book,
    chapter: item.chapter,
    verse: item.verse,
  })
  const subtitle = [item.artist, reference].filter(Boolean).join(' · ')

  return (
    <View
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
        <Text numberOfLines={1} style={[styles.rowTitle, { color: currentTheme.text }]}>
          {item.title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <IconButton
        onPressIn={drag}
        accessibilityLabel={DRAG_LABEL}
        Icon={<Ionicons size={26} name='reorder-three' color={currentTheme.textMuted} />}
      />
    </View>
  )
}
