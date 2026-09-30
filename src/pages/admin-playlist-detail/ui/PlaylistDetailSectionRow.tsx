import { View } from 'react-native'
import { type APITypes } from 'shared/api'
import { MovingText } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Строка раздела в детали плейлиста: только название.
// Секции из DTO плейлиста не несут надёжного счётчика плейлистов, поэтому
// мета скрыта на этом экране (счётчик корректен в списке разделов админки).
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
        <MovingText text={section.title} style={styles.rowTitle} />
      </View>
    </TouchableItem>
  )
}
