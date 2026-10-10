import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, featureFlagsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { type TouchedMap, useFormTouched } from 'shared/lib/hooks/useFormTouched'
import { isEmpty } from 'shared/lib/utils/isEmpty'
import { omitEqualFields } from 'shared/lib/utils/omitEqualFields'
import { showToast } from 'shared/model'
import {
  buildUpdateFlagRequest,
  createValidationError,
  type FlagFormValues,
  initialFlagFormValues,
} from './flagFormState'

export interface FlagFormController {
  error: null | string
  isDirty: boolean
  isSubmitting: boolean
  markTouched: (key: FlagRequiredField) => void
  onChange: <K extends keyof FlagFormValues>(key: K, value: FlagFormValues[K]) => void
  save: () => Promise<void>
  touched: TouchedMap<FlagRequiredField>
  values: FlagFormValues
}

type FlagRequiredField = 'key' | 'title'

const CREATE_SUCCESS_MESSAGE = 'Флаг создан'
const UPDATE_SUCCESS_MESSAGE = 'Флаг сохранён'
const CREATE_REQUIRED_FIELDS = ['key', 'title'] as const
const EDIT_REQUIRED_FIELDS = ['title'] as const

/**
 * Состояние формы фича-флага и отправка create/update. В режиме edit шлются
 * только изменённые поля title/enabled (ключ неизменяем). При создании, если
 * тумблер включён, флаг после создания досылается в enabled отдельным PATCH.
 * @param mode - Параметры режима формы.
 * @param mode.id - Идентификатор флага (только для edit).
 * @param mode.initial - Исходная сущность для edit (стабильные пропсы).
 * @param mode.mode - Создание или редактирование.
 */
export const useFlagFormController = ({
  id = '',
  initial,
  mode,
}: {
  id?: string
  initial?: APITypes.FeatureFlag
  mode: 'create' | 'edit'
}): FlagFormController => {
  const router = useRouter()
  const showToastAction = useAction(showToast)
  const [initialValues] = useState<FlagFormValues>(() => initialFlagFormValues(initial))
  const [values, setValues] = useState<FlagFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const { markAllTouched, markTouched, touched } = useFormTouched<FlagRequiredField>()

  const isDirty = !isEmpty(omitEqualFields(initialValues, values))

  const onChange = useCallback(
    <K extends keyof FlagFormValues>(key: K, value: FlagFormValues[K]) =>
      setValues(prev => ({ ...prev, [key]: value })),
    [],
  )

  const save = useCallback(async () => {
    const api = featureFlagsApi.getFeatureFlags()

    if (mode === 'edit' && initial) {
      markAllTouched(EDIT_REQUIRED_FIELDS)
      const payload = buildUpdateFlagRequest(values, initial)
      if (Object.keys(payload).length === 0) {
        router.back()
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        await api.featureFlagsControllerUpdate(id, payload)
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
      const created = await api.featureFlagsControllerCreate({
        key: values.key.trim(),
        title: values.title.trim(),
      })
      if (values.enabled) await api.featureFlagsControllerUpdate(created.id, { enabled: true })
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
