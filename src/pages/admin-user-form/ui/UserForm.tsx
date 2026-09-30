import { Text, View } from 'react-native'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type UserFormValues } from '../lib/userFormState'
import { styles } from './styles'
import { UserFormFields } from './UserFormFields'

type RequiredField = 'email' | 'name' | 'password' | 'username'

// Тело формы пользователя без кнопки сохранения (она живёт в headerRight).
export const UserForm = ({
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
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  touched: TouchedMap<RequiredField>
  values: UserFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <FormScrollView contentContainerStyle={styles.formContent}>
      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}
      <UserFormFields
        mode={mode}
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
    </FormScrollView>
  )
}
