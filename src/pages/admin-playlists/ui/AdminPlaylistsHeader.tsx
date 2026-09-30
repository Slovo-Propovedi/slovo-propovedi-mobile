import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, TextInput, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const SORT_OPTIONS: { label: string; value: APITypes.PlaylistControllerFindAllSort }[] = [
  { label: 'По дате', value: 'date' },
  { label: 'По названию', value: 'title' },
  { label: 'По разделу', value: 'section' },
]

const sortLabel = (sort: APITypes.PlaylistControllerFindAllSort) =>
  SORT_OPTIONS.find(option => option.value === sort)?.label ?? ''

// Следующий пункт сортировки по кругу: тап по кнопке листает варианты.
const nextSort = (sort: APITypes.PlaylistControllerFindAllSort) => {
  const index = SORT_OPTIONS.findIndex(option => option.value === sort)

  return SORT_OPTIONS[(index + 1) % SORT_OPTIONS.length].value
}

// Шапка списка плейлистов: заголовок, счётчик, поиск, сортировка, порядок и кнопка создания.
export const AdminPlaylistsHeader = ({
  count,
  onCreate,
  onOrderChange,
  onSearchChange,
  onSortChange,
  order,
  search,
  sort,
}: {
  count: number
  onCreate: () => void
  onOrderChange: (order: APITypes.PlaylistControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.PlaylistControllerFindAllSort) => void
  order: APITypes.PlaylistControllerFindAllOrder
  search: string
  sort: APITypes.PlaylistControllerFindAllSort
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Плейлисты</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            {`Всего: ${count}`}
          </Text>
        </View>
        <TouchableItem
          onPress={onCreate}
          style={[styles.createButton, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={styles.createButtonText}>Создать плейлист</Text>
        </TouchableItem>
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder='Поиск по названию'
        accessibilityLabel='Поиск плейлистов'
        placeholderTextColor={currentTheme.textMuted}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
      <View style={styles.controls}>
        <TouchableItem
          onPress={() => onSortChange(nextSort(sort))}
          style={[styles.loadMore, { backgroundColor: currentTheme.surface }]}
        >
          <Text style={[styles.loadMoreText, { color: currentTheme.text }]}>
            {`Сортировка: ${sortLabel(sort)}`}
          </Text>
        </TouchableItem>
        <IconButton
          onPress={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
          accessibilityLabel={order === 'asc' ? 'По возрастанию' : 'По убыванию'}
          Icon={
            <Ionicons
              size={22}
              color={currentTheme.text}
              name={order === 'asc' ? 'arrow-up' : 'arrow-down'}
            />
          }
        />
      </View>
    </View>
  )
}
