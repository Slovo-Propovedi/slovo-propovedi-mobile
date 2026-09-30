import { Text, View } from 'react-native'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { styles } from './styles'
import { SuggestionField } from './SuggestionField'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

// Блок «Основное» формы проповеди: название, проповедник, книга и описание.
// Проповедник и книга подсказываются ранее использованными значениями.
export const SermonFormMainFields = ({
  artists,
  books,
  onChange,
  values,
}: {
  artists: string[]
  books: string[]
  onChange: UpdateField
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.group}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Основное</Text>
      <FormField
        label='Название'
        value={values.title}
        placeholder='Например: Сила веры'
        onChangeText={text => onChange('title', text)}
      />
      <SuggestionField
        options={artists}
        label='Проповедник'
        value={values.artist}
        placeholder='Кто проповедует'
        onChangeText={text => onChange('artist', text)}
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
