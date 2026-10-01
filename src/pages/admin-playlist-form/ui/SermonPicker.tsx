import { useState } from 'react'
import { ActivityIndicator, FlatList, Text, TextInput, View } from 'react-native'
import { orderSelectedFirst } from 'shared/lib/utils/orderSelectedFirst'
import { AdminSermonRowSkeleton } from 'shared/ui'
import { COLORS, useTheme } from 'shared/ui/theme'
import { mergeById } from '../lib/mergeById'
import { type SermonOption } from '../lib/sermonOption'
import { useSermonSearch } from '../lib/useSermonSearch'
import { pickerStyles } from './pickerStyles'
import { SermonPickerRow } from './SermonPickerRow'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить проповеди'
const NO_RESULTS = 'Ничего не найдено'
const LIST_TEST_ID = 'sermon-picker-list'

// Поисковый список проповедей с чекбоксами и обложками. `selectedIds` — источник
// истины; выбранные строки идут первыми и остаются видимыми, даже если не
// попали в загруженную страницу (`selectedSermons` — снапшот уже включённых).
// Список внутри скроллящейся формы, поэтому собственный скролл выключен, а
// дозагрузка идёт по курсору при достижении конца.
export const SermonPicker = ({
  onToggle,
  selectedIds,
  selectedSermons,
}: {
  onToggle: (id: string) => void
  selectedIds: string[]
  selectedSermons: SermonOption[]
}) => {
  const { currentTheme } = useTheme()
  const [search, setSearch] = useState('')
  const { isError, isLoading, isLoadingMore, loadMore, sermons } = useSermonSearch(search)
  const options = orderSelectedFirst(
    mergeById<SermonOption>(sermons, selectedSermons),
    selectedIds,
    item => item.id,
  )

  return (
    <View>
      <TextInput
        value={search}
        onChangeText={setSearch}
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
          onEndReachedThreshold={0.5}
          keyExtractor={sermon => sermon.id}
          onEndReached={() => void loadMore()}
          ListFooterComponent={isLoadingMore ? <AdminSermonRowSkeleton /> : null}
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
