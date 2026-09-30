import { ScrollView, Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { type PlaylistFormValues } from '../lib/playlistFormState'
import { CoverPicker } from './CoverPicker'
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
  onChange,
  values,
}: {
  error: null | string
  onChange: UpdateField
  values: PlaylistFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.formContent}
      style={{ backgroundColor: currentTheme.background }}
    >
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}

      <PlaylistFormMainFields values={values} onChange={onChange} />
      <CoverPicker value={values.artwork} onChange={value => onChange('artwork', value)} />

      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Проповеди</Text>
        <SermonPicker
          selectedIds={values.selectedSermonIds}
          onToggle={id => onChange('selectedSermonIds', toggleId(values.selectedSermonIds, id))}
        />
      </View>

      <View style={styles.block}>
        <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Разделы</Text>
        <SectionPicker
          selectedIds={values.selectedSectionIds}
          onToggle={id => onChange('selectedSectionIds', toggleId(values.selectedSectionIds, id))}
        />
      </View>
    </ScrollView>
  )
}
