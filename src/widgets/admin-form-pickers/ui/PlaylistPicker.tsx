import { useState } from 'react'
import { ActivityIndicator, Text, TextInput, View } from 'react-native'
import { orderSelectedFirst } from 'shared/lib/utils/orderSelectedFirst'
import { COLORS, useTheme } from 'shared/ui/theme'
import { usePlaylistSearch } from '../lib/usePlaylistSearch'
import { pickerStyles } from './pickerStyles'
import { PlaylistPickerRow } from './PlaylistPickerRow'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить плейлисты'
const NO_RESULTS = 'Ничего не найдено'

// Поисковый список плейлистов с чекбоксами; выбранные строки идут первыми.
// `selectedIds` — источник истины, переживает поиск.
export const PlaylistPicker = ({
  onToggle,
  selectedIds,
}: {
  onToggle: (id: string) => void
  selectedIds: string[]
}) => {
  const { currentTheme } = useTheme()
  const [search, setSearch] = useState('')
  const { isError, isLoading, isSearchActive, playlists } = usePlaylistSearch(search)
  const orderedPlaylists = orderSelectedFirst(playlists, selectedIds, playlist => playlist.id)

  return (
    <View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder='Поиск по названию'
        accessibilityLabel='Поиск плейлистов'
        placeholderTextColor={currentTheme.placeholder}
        style={[
          styles.searchInput,
          { borderColor: currentTheme.textMuted, color: currentTheme.text },
        ]}
      />
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>
        {`Выбрано: ${selectedIds.length}`}
      </Text>
      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : isError ? (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>
      ) : isSearchActive && playlists.length === 0 ? (
        <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{NO_RESULTS}</Text>
      ) : (
        <View style={pickerStyles.list}>
          {orderedPlaylists.map(playlist => (
            <PlaylistPickerRow
              key={playlist.id}
              playlist={playlist}
              onToggle={() => onToggle(playlist.id)}
              isSelected={selectedIds.includes(playlist.id)}
            />
          ))}
        </View>
      )}
    </View>
  )
}
