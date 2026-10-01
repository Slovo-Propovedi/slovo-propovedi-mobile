import { Text, View } from 'react-native'
import { ROLE_LABELS } from 'entities/auth'
import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormField, SelectField, type SelectOption } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type UserFormValues } from '../lib/userFormState'
import { styles } from './styles'

type RequiredField = 'email' | 'name' | 'password' | 'username'

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

const isBlank = (value: string) => value.trim() === ''

// Поля формы пользователя. Пароль показывается только в режиме создания —
// смена пароля в edit идёт отдельным эндпоинтом на экране детали.
export const UserFormFields = ({
  markTouched,
  mode,
  onChange,
  touched,
  values,
}: {
  markTouched: (key: RequiredField) => void
  mode: 'create' | 'edit'
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  touched: TouchedMap<RequiredField>
  values: UserFormValues
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
        <FormField
          required
          label='Имя'
          value={values.name}
          onBlur={() => markTouched('name')}
          placeholder='Например: Иван Петров'
          onChangeText={text => onChange('name', text)}
          invalid={Boolean(touched.name) && isBlank(values.name)}
        />
        <FormField
          required
          label='Email'
          value={values.email}
          autoComplete='email'
          keyboardType='email-address'
          textContentType='emailAddress'
          placeholder='admin@example.com'
          onBlur={() => markTouched('email')}
          onChangeText={text => onChange('email', text)}
          invalid={Boolean(touched.email) && isBlank(values.email)}
        />
        <FormField
          required
          label='Логин'
          hint={LOGIN_HINT}
          value={values.username}
          autoComplete='username'
          textContentType='username'
          onBlur={() => markTouched('username')}
          placeholder='Логин для входа в систему'
          onChangeText={text => onChange('username', text)}
          invalid={Boolean(touched.username) && isBlank(values.username)}
        />
        <SelectField
          label='Роль'
          value={values.role}
          options={ROLE_OPTIONS}
          onChange={value => onChange('role', value)}
        />
        {isEdit ? null : (
          <FormField
            required
            label='Пароль'
            secureTextEntry
            hint={PASSWORD_HINT}
            placeholder='Пароль'
            value={values.password}
            onBlur={() => markTouched('password')}
            onChangeText={text => onChange('password', text)}
            invalid={Boolean(touched.password) && isBlank(values.password)}
          />
        )}
      </View>
    </View>
  )
}
