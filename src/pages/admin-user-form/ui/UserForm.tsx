import { ScrollView, Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { type UserFormValues } from '../lib/userFormState'
import { styles } from './styles'
import { UserFormFields } from './UserFormFields'

// Тело формы пользователя без кнопки сохранения (она живёт в headerRight).
export const UserForm = ({
  error,
  mode,
  onChange,
  values,
}: {
  error: null | string
  mode: 'create' | 'edit'
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  values: UserFormValues
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
      <UserFormFields mode={mode} values={values} onChange={onChange} />
    </ScrollView>
  )
}
