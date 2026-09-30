import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { type TouchedMap, useFormTouched } from 'shared/lib/hooks/useFormTouched'
import { isEmpty } from 'shared/lib/utils/isEmpty'
import { omitEqualFields } from 'shared/lib/utils/omitEqualFields'
import { showToast } from 'shared/model'
import {
  buildCreateUserRequest,
  buildUpdateUserRequest,
  createValidationError,
  hasBlankUpdateRequired,
  initialUserFormValues,
  type UserFormValues,
} from './userFormState'

export interface UserFormController {
  error: null | string
  isDirty: boolean
  isSubmitting: boolean
  markTouched: (key: UserRequiredField) => void
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  save: () => Promise<void>
  touched: TouchedMap<UserRequiredField>
  values: UserFormValues
}

type UserRequiredField = 'email' | 'name' | 'password' | 'username'

const CREATE_SUCCESS_MESSAGE = 'Пользователь создан'
const UPDATE_SUCCESS_MESSAGE = 'Пользователь сохранён'
const EDIT_REQUIRED_MESSAGE = 'Имя, email и логин не должны быть пустыми.'
const CREATE_REQUIRED_FIELDS = ['name', 'email', 'username', 'password'] as const
const EDIT_REQUIRED_FIELDS = ['name', 'email', 'username'] as const

/**
 * Состояние формы пользователя и отправка create/update. В режиме edit шлются
 * только изменённые поля (без пароля — он меняется отдельным эндпоинтом).
 * @param mode - Параметры режима формы.
 * @param mode.id - Идентификатор пользователя (только для edit).
 * @param mode.initial - Исходная сущность для edit (стабильные пропсы).
 * @param mode.mode - Создание или редактирование.
 */
export const useUserFormController = ({
  id = '',
  initial,
  mode,
}: {
  id?: string
  initial?: APITypes.UserResponse
  mode: 'create' | 'edit'
}): UserFormController => {
  const router = useRouter()
  const showToastAction = useAction(showToast)
  const [initialValues] = useState<UserFormValues>(() => initialUserFormValues(initial))
  const [values, setValues] = useState<UserFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const { markAllTouched, markTouched, touched } = useFormTouched<UserRequiredField>()

  const isDirty = !isEmpty(omitEqualFields(initialValues, values))

  const onChange = useCallback(
    <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
      setValues(prev => ({ ...prev, [key]: value })),
    [],
  )

  const save = useCallback(async () => {
    const api = usersApi.getUsers()

    if (mode === 'edit' && initial) {
      markAllTouched(EDIT_REQUIRED_FIELDS)
      const payload = buildUpdateUserRequest(values, initial)
      if (Object.keys(payload).length === 0) {
        router.back()
        return
      }
      if (hasBlankUpdateRequired(payload)) {
        setError(EDIT_REQUIRED_MESSAGE)
        showToastAction(EDIT_REQUIRED_MESSAGE)
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        await api.usersControllerUpdate(id, payload)
        showToastAction(UPDATE_SUCCESS_MESSAGE)
        router.back()
      } catch (submitError) {
        setError(getErrorMessage(submitError))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    markAllTouched(CREATE_REQUIRED_FIELDS)
    const validationError = createValidationError(values)
    if (validationError !== '') {
      setError(validationError)
      showToastAction(validationError)
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      await api.usersControllerCreate(buildCreateUserRequest(values))
      showToastAction(CREATE_SUCCESS_MESSAGE)
      router.back()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }, [id, initial, markAllTouched, mode, router, showToastAction, values])

  return { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values }
}
