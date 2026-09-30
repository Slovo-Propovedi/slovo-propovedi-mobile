import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, TextInput, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { AdminSelect, type AdminSelectOption } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const SORT_OPTIONS: AdminSelectOption<APITypes.PlaylistControllerFindAllSort>[] = [
  { label: 'По дате', value: 'date' },
  { label: 'По названию', value: 'title' },
  { label: 'По разделу', value: 'section' },
]

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
        placeholderTextColor={currentTheme.placeholder}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
      <View style={styles.controls}>
        <AdminSelect value={sort} options={SORT_OPTIONS} onChange={onSortChange} />
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
