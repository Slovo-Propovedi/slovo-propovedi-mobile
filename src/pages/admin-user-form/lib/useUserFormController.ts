import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, usersApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import {
  buildCreateUserRequest,
  buildUpdateUserRequest,
  createValidationError,
  initialUserFormValues,
  type UserFormValues,
} from './userFormState'

export interface UserFormController {
  error: null | string
  isSubmitting: boolean
  onChange: <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => void
  save: () => Promise<void>
  values: UserFormValues
}

const CREATE_SUCCESS_MESSAGE = 'Пользователь создан'
const UPDATE_SUCCESS_MESSAGE = 'Пользователь сохранён'

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
  const [values, setValues] = useState<UserFormValues>(() => initialUserFormValues(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const onChange = useCallback(
    <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
      setValues(prev => ({ ...prev, [key]: value })),
    [],
  )

  const save = useCallback(async () => {
    const api = usersApi.getUsers()

    if (mode === 'edit' && initial) {
      const payload = buildUpdateUserRequest(values, initial)
      if (Object.keys(payload).length === 0) {
        router.back()
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
  }, [id, initial, mode, router, showToastAction, values])

  return { error, isSubmitting, onChange, save, values }
}
