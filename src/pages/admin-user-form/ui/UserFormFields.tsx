import { Text, View } from 'react-native'
import { ROLE_LABELS } from 'entities/auth'
import { FormField, SelectField, type SelectOption } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type UserFormValues } from '../lib/userFormState'
import { styles } from './styles'

const ROLE_OPTIONS: SelectOption<UserFormValues['role']>[] = [
  { label: ROLE_LABELS.admin, value: 'admin' },
  { label: ROLE_LABELS.moderator, value: 'moderator' },
  { label: ROLE_LABELS.user, value: 'user' },
]

const LOGIN_HINT = 'Необязательно совпадает с именем.'
const PASSWORD_HINT = 'Пользователь войдёт в систему с этим паролем.'

const TITLE_CREATE = 'Новый пользователь'
const TITLE_EDIT = 'Редактирование пользователя'
const SUBTITLE_CREATE =
  'Роль определяет доступ: администратор и модератор входят в панель, обычный пользователь — нет.'
const SUBTITLE_EDIT = 'Пароль меняется отдельно на странице пользователя.'

// Поля формы пользователя. Пароль показывается только в режиме создания —
// смена пароля в edit идёт отдельным эндпоинтом на экране детали.
export const UserFormFields = ({
  mode,
  onChange,
  values,
}: {
  mode: 'create' | 'edit'
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  values: UserFormValues
}) => {
  const { currentTheme } = useTheme()
  const isEdit = mode === 'edit'

  return (
    <View>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {isEdit ? TITLE_EDIT : TITLE_CREATE}
      </Text>
      <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
        {isEdit ? SUBTITLE_EDIT : SUBTITLE_CREATE}
      </Text>
      <FormField
        label='Имя'
        value={values.name}
        placeholder='Например: Иван Петров'
        onChangeText={text => onChange('name', text)}
      />
      <FormField
        label='Email'
        value={values.email}
        keyboardType='email-address'
        placeholder='admin@example.com'
        onChangeText={text => onChange('email', text)}
      />
      <FormField
        label='Логин'
        hint={LOGIN_HINT}
        value={values.username}
        placeholder='Логин для входа в систему'
        onChangeText={text => onChange('username', text)}
      />
      <SelectField
        label='Роль'
        value={values.role}
        options={ROLE_OPTIONS}
        onChange={value => onChange('role', value)}
      />
      {isEdit ? null : (
        <FormField
          label='Пароль'
          secureTextEntry
          hint={PASSWORD_HINT}
          placeholder='Пароль'
          value={values.password}
          onChangeText={text => onChange('password', text)}
        />
      )}
    </View>
  )
}
