import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, TextInput, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { AdminSelect, type AdminSelectOption, RefreshButton } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const SORT_OPTIONS: AdminSelectOption<APITypes.SermonControllerFindAllSort>[] = [
  { label: 'По дате', value: 'date' },
  { label: 'По названию', value: 'title' },
  { label: 'По автору', value: 'artist' },
  { label: 'По плейлисту', value: 'playlist' },
]

// Шапка списка проповедей: заголовок, счётчик, поиск, сортировка, порядок и
// кнопка загрузки.
export const AdminSermonsHeader = ({
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
  onOrderChange: (order: APITypes.SermonControllerFindAllOrder) => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: APITypes.SermonControllerFindAllSort) => void
  order: APITypes.SermonControllerFindAllOrder
  search: string
  sort: APITypes.SermonControllerFindAllSort
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Проповеди</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            {`Всего: ${count}`}
          </Text>
        </View>
        <RefreshButton />
        <IconButton
          onPress={onCreate}
          accessibilityLabel='Загрузить проповедь'
          Icon={<Ionicons size={24} name='add-outline' color={currentTheme.primary} />}
        />
      </View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        maxLength={INPUT_LIMITS.search}
        accessibilityLabel='Поиск проповедей'
        placeholder='Название, проповедник, книга…'
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
