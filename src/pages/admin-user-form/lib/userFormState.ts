import { type APITypes } from 'shared/api'

export interface UserFormValues {
  email: string
  name: string
  password: string
  role: APITypes.UserRole
  username: string
}

// Least-privilege default: новый аккаунт стартует обычным пользователем, пока
// администратор не выберет иную роль.
const DEFAULT_ROLE: APITypes.UserRole = 'user'

export const initialUserFormValues = (initial?: APITypes.UserResponse | null): UserFormValues => ({
  email: initial?.email ?? '',
  name: initial?.name ?? '',
  password: '',
  role: initial?.role ?? DEFAULT_ROLE,
  username: initial?.username ?? '',
})

const isFilled = (value: string) => value.trim() !== ''

/**
 * Тело создания пользователя: `role` шлётся всегда, пароль обязателен.
 * @param values - Текущие значения формы.
 */
export const buildCreateUserRequest = (values: UserFormValues): APITypes.CreateUserRequest => ({
  email: values.email.trim(),
  name: values.name.trim(),
  password: values.password.trim(),
  role: values.role,
  username: values.username.trim(),
})

/**
 * Тело обновления пользователя: **только изменённые** поля (name/email/username/role).
 * Пустые ключи означают «не менять»; пароль через этот эндпоинт не передаётся.
 * @param values - Текущие значения формы.
 * @param initial - Исходная сущность для сравнения.
 */
export const buildUpdateUserRequest = (
  values: UserFormValues,
  initial: APITypes.UserResponse,
): APITypes.UpdateUserRequest => {
  const payload: APITypes.UpdateUserRequest = {}

  if (values.name.trim() !== initial.name.trim()) payload.name = values.name.trim()
  if (values.email.trim() !== initial.email.trim()) payload.email = values.email.trim()
  if (values.username.trim() !== initial.username.trim()) payload.username = values.username.trim()
  if (values.role !== initial.role) payload.role = values.role

  return payload
}

/**
 * Валидация формы создания: обязательны имя, email, логин и пароль.
 * @param values - Текущие значения формы.
 */
export const createValidationError = (values: UserFormValues): string =>
  isFilled(values.name) &&
  isFilled(values.email) &&
  isFilled(values.username) &&
  isFilled(values.password)
    ? ''
    : 'Заполните все поля.'
