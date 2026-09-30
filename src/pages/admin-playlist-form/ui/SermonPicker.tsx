import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { orderSelectedFirst } from 'shared/lib/utils/orderSelectedFirst'
import { COLORS, useTheme } from 'shared/ui/theme'
import { useSermonSearch } from '../lib/useSermonSearch'
import { pickerStyles } from './pickerStyles'
import { SermonPickerRow } from './SermonPickerRow'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить проповеди'
const NO_RESULTS = 'Ничего не найдено'

// Поисковый список проповедей с чекбоксами и обложками. `selectedIds` — источник
// истины, переживает поиск; выбранные строки идут первыми.
export const SermonPicker = ({
  onToggle,
  selectedIds,
}: {
  onToggle: (id: string) => void
  selectedIds: string[]
}) => {
  const { currentTheme } = useTheme()
  const [search, setSearch] = useState('')
  const { isError, isLoading, sermons } = useSermonSearch(search)
  const orderedSermons = orderSelectedFirst(sermons, selectedIds, sermon => sermon.id)

  return (
    <View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Поиск по названию'
        accessibilityLabel='Поиск проповедей'
        placeholderTextColor={currentTheme.textMuted}
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
      ) : search !== '' && sermons.length === 0 ? (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{NO_RESULTS}</Text>
      ) : (
        <View style={pickerStyles.list}>
          {orderedSermons.map(sermon => (
            <SermonPickerRow
              key={sermon.id}
              sermon={sermon}
              onToggle={() => onToggle(sermon.id)}
              isSelected={selectedIds.includes(sermon.id)}
            />
          ))}
        </View>
      )}
    </View>
  )
}
