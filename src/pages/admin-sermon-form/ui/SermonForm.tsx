import { Text, View } from 'react-native'
import { PlaylistPicker } from 'widgets/admin-form-pickers'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { useSermonSuggestions } from '../lib/useSermonSuggestions'
import { SermonFormMainFields } from './SermonFormMainFields'
import { SermonMediaFields } from './SermonMediaFields'
import { SermonScriptureFields } from './SermonScriptureFields'
import { styles } from './styles'

// Обязательные поля проповеди, помечаемые звёздочкой и inline-подсветкой.
export type SermonRequiredField = 'artist' | 'title'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(currentId => currentId !== id) : [...ids, id]

// Тело формы проповеди без кнопки сохранения (она живёт в headerRight):
// основные поля, Писание, медиа и поисковый выбор плейлистов. Страница
// скроллится целиком — отдельного внутреннего скролла у пикеров нет.
export const SermonForm = ({
  error,
  markTouched,
  onChange,
  onChapterEndChange,
  onSubmit,
  touched,
  values,
}: {
  error: null | string
  markTouched: (key: SermonRequiredField) => void
  onChange: UpdateField
  onChapterEndChange: (value: string) => void
  onSubmit?: () => void
  touched: TouchedMap<SermonRequiredField>
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()
  const { artists, books } = useSermonSuggestions()

  return (
    <FormScrollView onSubmit={onSubmit} contentContainerStyle={styles.formContent}>
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}

      <SermonFormMainFields
        books={books}
        values={values}
        artists={artists}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
      <SermonScriptureFields
        values={values}
        onChange={onChange}
        onChapterEndChange={onChapterEndChange}
      />
      <SermonMediaFields values={values} onChange={onChange} />

      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Плейлисты</Text>
        <PlaylistPicker
          selectedIds={values.selectedPlaylistIds}
          onToggle={id => onChange('selectedPlaylistIds', toggleId(values.selectedPlaylistIds, id))}
        />
      </View>
    </FormScrollView>
  )
}
