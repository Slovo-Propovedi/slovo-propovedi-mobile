import { Text, View } from 'react-native'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type FlagFormValues } from '../lib/flagFormState'
import { FlagFormFields } from './FlagFormFields'
import { styles } from './styles'

type RequiredField = 'key' | 'title'

// Тело формы фича-флага без кнопки сохранения (она живёт в headerRight).
export const FlagForm = ({
  error,
  markTouched,
  mode,
  onChange,
  touched,
  values,
}: {
  error: null | string
  markTouched: (key: RequiredField) => void
  mode: 'create' | 'edit'
  onChange: <K extends keyof FlagFormValues>(key: K, value: FlagFormValues[K]) => void
  touched: TouchedMap<RequiredField>
  values: FlagFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <FormScrollView contentContainerStyle={styles.formContent}>
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}
      <FlagFormFields
        mode={mode}
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
    </FormScrollView>
  )
}
