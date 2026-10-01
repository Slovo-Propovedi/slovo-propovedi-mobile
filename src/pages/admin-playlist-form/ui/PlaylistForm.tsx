import { Text, View } from 'react-native'
import { CoverPicker } from 'widgets/admin-form-pickers'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type PlaylistFormValues } from '../lib/playlistFormState'
import { type SermonOption } from '../lib/sermonOption'
import { PlaylistFormMainFields } from './PlaylistFormMainFields'
import { SectionPicker } from './SectionPicker'
import { SermonPicker } from './SermonPicker'
import { styles } from './styles'

type UpdateField = <K extends keyof PlaylistFormValues>(
  key: K,
  value: PlaylistFormValues[K],
) => void

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(currentId => currentId !== id) : [...ids, id]

// Тело формы плейлиста без кнопки сохранения (она живёт в headerRight):
// основные поля, обложка, поисковый выбор проповедей и выбор разделов.
// Страница скроллится целиком — отдельного внутреннего скролла у пикеров нет.
export const PlaylistForm = ({
  error,
  markTouched,
  onChange,
  selectedSermons,
  touched,
  values,
}: {
  error: null | string
  markTouched: (key: 'title') => void
  onChange: UpdateField
  selectedSermons: SermonOption[]
  touched: TouchedMap<'title'>
  values: PlaylistFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <FormScrollView contentContainerStyle={styles.formContent}>
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}

      <PlaylistFormMainFields
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
      <CoverPicker value={values.artwork} onChange={value => onChange('artwork', value)} />

      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Разделы</Text>
        <SectionPicker
          selectedIds={values.selectedSectionIds}
          onToggle={id => onChange('selectedSectionIds', toggleId(values.selectedSectionIds, id))}
        />
      </View>

      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Проповеди</Text>
        <SermonPicker
          selectedSermons={selectedSermons}
          selectedIds={values.selectedSermonIds}
          onToggle={id => onChange('selectedSermonIds', toggleId(values.selectedSermonIds, id))}
        />
      </View>
    </FormScrollView>
  )
}
