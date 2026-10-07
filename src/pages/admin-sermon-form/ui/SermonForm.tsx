import { Text, View } from 'react-native'
import { PlaylistPicker } from 'widgets/admin-form-pickers'
import { predictedMimeGroups, useFileDrop } from 'shared/lib/file-drop'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { DropOverlay } from 'shared/ui'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { useDroppedMediaUpload } from '../lib/useDroppedMediaUpload'
import { useSermonSuggestions } from '../lib/useSermonSuggestions'
import { SermonFormMainFields } from './SermonFormMainFields'
import { SermonMediaFields } from './SermonMediaFields'
import { SermonScriptureFields } from './SermonScriptureFields'
import { styles } from './styles'

// Обязательные поля проповеди, помечаемые звёздочкой и inline-подсветкой.
export type SermonRequiredField = 'artist' | 'title'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

// Строки оверлея drop: текст готов заранее, `group` совпадает со строками
// `AdminFileKind`, чтобы подсветить предугаданные по MIME виды.
const DROP_ENTRIES = [
  { description: 'Изображение (JPEG, PNG, WebP) → обложка', group: 'image' },
  { description: 'Аудио (MP3, M4A) → аудиофайл', group: 'audio' },
  { description: 'Текст (PDF, FB2, TXT) → текстовый файл', group: 'text' },
] as const

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(currentId => currentId !== id) : [...ids, id]

// Тело формы проповеди без кнопки сохранения (она живёт в headerRight):
// основные поля, Писание, медиа и поисковый выбор плейлистов. Страница
// скроллится целиком — отдельного внутреннего скролла у пикеров нет.
// Drag & drop-хуки живут здесь, у полноразмерного контейнера: оверлей
// absolute-fill должен накрывать весь экран, а не только блок медиа.
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
  const { handleFiles, status } = useDroppedMediaUpload(onChange)
  const { draggedMimeTypes, isDragActive } = useFileDrop(handleFiles)
  const predictedGroups = predictedMimeGroups(draggedMimeTypes)
  const dropEntries = DROP_ENTRIES.map(entry => ({
    active: predictedGroups.has(entry.group),
    description: entry.description,
  }))

  return (
    <View style={styles.container}>
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
        <SermonMediaFields
          values={values}
          status={status}
          onChange={onChange}
          isDragActive={isDragActive}
        />

        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Плейлисты</Text>
          <PlaylistPicker
            selectedIds={values.selectedPlaylistIds}
            onToggle={id =>
              onChange('selectedPlaylistIds', toggleId(values.selectedPlaylistIds, id))
            }
          />
        </View>
      </FormScrollView>
      <DropOverlay entries={dropEntries} visible={isDragActive} />
    </View>
  )
}
