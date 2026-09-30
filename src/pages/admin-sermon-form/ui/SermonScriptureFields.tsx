import { Text, View } from 'react-native'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { isRangeMode, verseError } from '../lib/sermonFormState'
import { styles } from './styles'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

// Блок «Писание» формы проповеди: глава (с включением режима диапазона по полю
// «по») и стихи. В обычном режиме стихи вводятся свободным текстом, в режиме
// диапазона — парой «от/до». Живая ошибка появляется при неверном вводе.
export const SermonScriptureFields = ({
  onChange,
  onChapterEndChange,
  values,
}: {
  onChange: UpdateField
  onChapterEndChange: (value: string) => void
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()
  const rangeMode = isRangeMode(values)
  const error = verseError(values)

  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Писание</Text>
      <View style={styles.rangeRow}>
        <View style={styles.rangeField}>
          <FormField
            label='Глава'
            placeholder='3'
            keyboardType='number-pad'
            value={values.chapterStart}
            onChangeText={text => onChange('chapterStart', text)}
          />
        </View>
        <View style={styles.rangeField}>
          <FormField
            placeholder='4'
            label='Глава (по)'
            keyboardType='number-pad'
            value={values.chapterEnd}
            onChangeText={onChapterEndChange}
            hint='Заполните для диапазона глав.'
          />
        </View>
      </View>

      {rangeMode ? (
        <View style={styles.rangeRow}>
          <View style={styles.rangeField}>
            <FormField
              label='Стих'
              placeholder='16'
              keyboardType='number-pad'
              value={values.verseStart}
              onChangeText={text => onChange('verseStart', text)}
            />
          </View>
          <View style={styles.rangeField}>
            <FormField
              placeholder='18'
              label='Стих (по)'
              value={values.verseEnd}
              keyboardType='number-pad'
              onChangeText={text => onChange('verseEnd', text)}
            />
          </View>
        </View>
      ) : (
        <FormField
          label='Стихи'
          placeholder='16'
          value={values.verseText}
          hint='Примеры: 16, 16–18, 9–18, 20.'
          onChangeText={text => onChange('verseText', text)}
        />
      )}

      {error ? (
        <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
      ) : null}
    </View>
  )
}
