import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native'
import { orderSelectedFirst } from 'shared/lib/utils/orderSelectedFirst'
import { COLORS, useTheme } from 'shared/ui/theme'
import { mergeById } from '../lib/mergeById'
import { type SermonOption } from '../lib/sermonOption'
import { type SermonSearchState } from '../lib/useSermonSearch'
import { pickerStyles } from './pickerStyles'
import { SermonPickerFooter } from './SermonPickerFooter'
import { SermonPickerRow } from './SermonPickerRow'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить проповеди'
const NO_RESULTS = 'Ничего не найдено'
const LIST_TEST_ID = 'sermon-picker-list'

// Поисковый список проповедей с чекбоксами и обложками. `selectedIds` — источник
// истины; выбранные строки идут первыми и остаются видимыми, даже если не
// попали в загруженную страницу (`selectedSermons` — снапшот уже включённых).
// Список внутри скроллящейся формы и собственного скролла не имеет, поэтому
// дозагрузку по курсору запускает внешний скролл формы (`onNearEnd` в
// `PlaylistForm` -> `FormScrollView`), а не `onEndReached` этого FlatList.
export const SermonPicker = ({
  onSearchChange,
  onToggle,
  search,
  searchState,
  selectedIds,
  selectedSermons,
}: {
  onSearchChange: (value: string) => void
  onToggle: (id: string) => void
  search: string
  searchState: SermonSearchState
  selectedIds: string[]
  selectedSermons: SermonOption[]
}) => {
  const { currentTheme } = useTheme()
  const { isError, isLoading, isLoadingMore, loadMore, loadMoreFailed, sermons } = searchState
  const options = orderSelectedFirst(
    mergeById<SermonOption>(sermons, selectedSermons),
    selectedIds,
    item => item.id,
  )

  return (
    <View>
      <TextInput
        value={search}
        onChangeText={onSearchChange}
        placeholder='Поиск по названию'
        accessibilityLabel='Поиск проповедей'
        placeholderTextColor={currentTheme.placeholder}
        style={[styles.input, { borderColor: currentTheme.textMuted, color: currentTheme.text }]}
      />
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>
        {`Выбрано: ${selectedIds.length}`}
      </Text>
      {isLoading ? (
        <View style={pickerStyles.state}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : isError ? (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
      ) : search !== '' && options.length === 0 ? (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{NO_RESULTS}</Text>
      ) : (
        <FlatList
          data={options}
          testID={LIST_TEST_ID}
          scrollEnabled={false}
          keyExtractor={sermon => sermon.id}
          ListFooterComponent={
            <SermonPickerFooter
              isLoadingMore={isLoadingMore}
              loadMoreFailed={loadMoreFailed}
              onRetry={() => void loadMore()}
            />
          }
          renderItem={({ item }) => (
            <SermonPickerRow
              sermon={item}
              onToggle={() => onToggle(item.id)}
              isSelected={selectedIds.includes(item.id)}
            />
          )}
        />
      )}
    </View>
  )
}
