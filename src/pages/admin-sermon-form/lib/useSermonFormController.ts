import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, sermonsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { initialFormValues, type SermonFormValues } from './sermonFormInitialValues'
import {
  applyChapterEndChange,
  buildCreateSermonDto,
  buildUpdateSermonDto,
  resolveVerse,
  verseError,
} from './sermonFormState'

export interface SermonFormController {
  error: null | string
  isSubmitting: boolean
  onChange: <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void
  onChapterEndChange: (value: string) => void
  save: () => Promise<void>
  values: SermonFormValues
}

const CREATE_SUCCESS_MESSAGE = 'Проповедь создана'
const UPDATE_SUCCESS_MESSAGE = 'Проповедь сохранена'
const TITLE_REQUIRED_MESSAGE = 'Укажите название проповеди'
const ARTIST_REQUIRED_MESSAGE = 'Укажите проповедника'

/**
 * Состояние формы проповеди и отправка create/update. Название и проповедник
 * обязательны; невалидный ввод стихов блокирует отправку (inline-ошибка уже
 * видна). Смена конца главы переключает режим стихов.
 * @param mode - Параметры режима формы.
 * @param mode.id - Идентификатор проповеди (только для edit).
 * @param mode.initial - Исходная сущность для edit (стабильные пропсы).
 * @param mode.mode - Создание или редактирование.
 */
export const useSermonFormController = ({
  id = '',
  initial,
  mode,
}: {
  id?: string
  initial?: APITypes.SermonEntity
  mode: 'create' | 'edit'
}): SermonFormController => {
  const router = useRouter()
  const showToastAction = useAction(showToast)
  const [values, setValues] = useState<SermonFormValues>(() => initialFormValues(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const onChange = useCallback(
    <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) =>
      setValues(prev => ({ ...prev, [key]: value })),
    [],
  )

  const onChapterEndChange = useCallback(
    (value: string) => setValues(prev => applyChapterEndChange(prev, value)),
    [],
  )

  const save = useCallback(async () => {
    if (values.title.trim().length === 0) {
      setError(TITLE_REQUIRED_MESSAGE)
      showToastAction(TITLE_REQUIRED_MESSAGE)
      return
    }
    if (values.artist.trim().length === 0) {
      setError(ARTIST_REQUIRED_MESSAGE)
      showToastAction(ARTIST_REQUIRED_MESSAGE)
      return
    }
    if (verseError(values) !== '' || resolveVerse(values) === undefined) return

    setError(null)
    setIsSubmitting(true)
    const api = sermonsApi.getSermons()

    try {
      if (mode === 'edit') {
        await api.sermonControllerUpdate(id, buildUpdateSermonDto(values))
        showToastAction(UPDATE_SUCCESS_MESSAGE)
      } else {
        await api.sermonControllerCreate(buildCreateSermonDto(values))
        showToastAction(CREATE_SUCCESS_MESSAGE)
      }
      router.back()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }, [id, mode, router, showToastAction, values])

  return { error, isSubmitting, onChange, onChapterEndChange, save, values }
}
