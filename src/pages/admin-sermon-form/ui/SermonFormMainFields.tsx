import { View } from 'react-native'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormField, FormGroupTitle } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { styles } from './styles'
import { SuggestionField } from './SuggestionField'

type RequiredField = 'artist' | 'title'
type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

const isBlank = (value: string) => value.trim() === ''

// Блок «Основное» формы проповеди: название, проповедник, книга и описание.
// Проповедник и книга подсказываются ранее использованными значениями.
// Название и проповедник обязательны: звёздочка и красная рамка при потере
// фокуса с пустым значением.
export const SermonFormMainFields = ({
  artists,
  books,
  markTouched,
  onChange,
  touched,
  values,
}: {
  artists: string[]
  books: string[]
  markTouched: (key: RequiredField) => void
  onChange: UpdateField
  touched: TouchedMap<RequiredField>
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.group}>
      <FormGroupTitle style={[styles.blockTitle, { color: currentTheme.text }]}>
        Основное
      </FormGroupTitle>
      <FormField
        required
        label='Название'
        value={values.title}
        placeholder='Например: Сила веры'
        onBlur={() => markTouched('title')}
        onChangeText={text => onChange('title', text)}
        invalid={Boolean(touched.title) && isBlank(values.title)}
      />
      <SuggestionField
        required
        options={artists}
        label='Проповедник'
        value={values.artist}
        placeholder='Кто проповедует'
        onBlur={() => markTouched('artist')}
        onChangeText={text => onChange('artist', text)}
        invalid={Boolean(touched.artist) && isBlank(values.artist)}
      />
      <SuggestionField
        label='Книга'
        options={books}
        value={values.book}
        placeholder='Книга Писания'
        hint='Необязательно. Например: Иоанна'
        onChangeText={text => onChange('book', text)}
      />
      <FormField
        multiline
        label='Описание'
        hint='Необязательно.'
        value={values.description}
        placeholder='Короткое описание проповеди'
        onChangeText={text => onChange('description', text)}
      />
    </View>
  )
}
