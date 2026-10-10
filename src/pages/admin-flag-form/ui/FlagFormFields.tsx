import { Text, View } from 'react-native'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { CheckboxField, FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type FlagFormValues } from '../lib/flagFormState'
import { styles } from './styles'

type RequiredField = 'key' | 'title'

const TITLE_CREATE = 'Новый флаг'
const TITLE_EDIT = 'Редактирование флага'
const SUBTITLE_CREATE = 'Флаг создаётся выключенным — включите его, если нужно.'
const SUBTITLE_EDIT = 'Ключ нельзя изменить после создания.'
const KEY_HINT = 'Строчные латинские буквы, цифры и дефис, начинается с буквы.'
const ENABLED_LABEL = 'Включён'

const isBlank = (value: string) => value.trim() === ''

// Поля формы фича-флага. Ключ редактируется только при создании — после
// создания он показывается read-only (серверный ключ неизменяем в UI).
export const FlagFormFields = ({
  markTouched,
  mode,
  onChange,
  touched,
  values,
}: {
  markTouched: (key: RequiredField) => void
  mode: 'create' | 'edit'
  onChange: <K extends keyof FlagFormValues>(key: K, value: FlagFormValues[K]) => void
  touched: TouchedMap<RequiredField>
  values: FlagFormValues
}) => {
  const { currentTheme } = useTheme()
  const isEdit = mode === 'edit'

  return (
    <View>
      <View>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {isEdit ? TITLE_EDIT : TITLE_CREATE}
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
          {isEdit ? SUBTITLE_EDIT : SUBTITLE_CREATE}
        </Text>
      </View>
      <View style={styles.formGroup}>
        {isEdit ? (
          <View style={styles.readOnlyField}>
            <Text style={[styles.readOnlyLabel, { color: currentTheme.text }]}>Ключ</Text>
            <Text
              accessibilityLabel='Ключ'
              style={[
                styles.readOnlyValue,
                { borderColor: currentTheme.textMuted, color: currentTheme.textMuted },
              ]}
            >
              {values.key}
            </Text>
          </View>
        ) : (
          <FormField
            required
            label='Ключ'
            hint={KEY_HINT}
            value={values.key}
            placeholder='Например: read'
            onBlur={() => markTouched('key')}
            onChangeText={text => onChange('key', text)}
            invalid={Boolean(touched.key) && isBlank(values.key)}
          />
        )}
        <FormField
          required
          label='Название'
          value={values.title}
          placeholder='Например: Читать'
          onBlur={() => markTouched('title')}
          onChangeText={text => onChange('title', text)}
          invalid={Boolean(touched.title) && isBlank(values.title)}
        />
        <CheckboxField
          label={ENABLED_LABEL}
          value={values.enabled}
          onChange={value => onChange('enabled', value)}
        />
      </View>
    </View>
  )
}
