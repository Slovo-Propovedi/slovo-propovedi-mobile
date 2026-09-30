import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { type APITypes, playlistsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { type TouchedMap, useFormTouched } from 'shared/lib/hooks/useFormTouched'
import { isEmpty } from 'shared/lib/utils/isEmpty'
import { omitEqualFields } from 'shared/lib/utils/omitEqualFields'
import { showToast } from 'shared/model'
import {
  buildCreatePlaylistDto,
  buildUpdatePlaylistDto,
  initialFormValues,
  type PlaylistFormValues,
} from './playlistFormState'

export interface PlaylistFormController {
  error: null | string
  isDirty: boolean
  isSubmitting: boolean
  markTouched: (key: 'title') => void
  onChange: <K extends keyof PlaylistFormValues>(key: K, value: PlaylistFormValues[K]) => void
  save: () => Promise<void>
  touched: TouchedMap<'title'>
  values: PlaylistFormValues
}

const CREATE_SUCCESS_MESSAGE = 'Плейлист создан'
const UPDATE_SUCCESS_MESSAGE = 'Плейлист сохранён'
const TITLE_REQUIRED_MESSAGE = 'Укажите название плейлиста'
const REQUIRED_FIELDS = ['title'] as const

/**
 * Состояние формы плейлиста и отправка create/update. Название обязательно:
 * пустое поле не отправляется, показывается ошибка и тост.
 * @param mode - Параметры режима формы.
 * @param mode.id - Идентификатор плейлиста (только для edit).
 * @param mode.initial - Исходная сущность для edit (стабильные пропсы).
 * @param mode.mode - Создание или редактирование.
 */
export const usePlaylistFormController = ({
  id = '',
  initial,
  mode,
}: {
  id?: string
  initial?: APITypes.PlaylistEntity
  mode: 'create' | 'edit'
}): PlaylistFormController => {
  const router = useRouter()
  const showToastAction = useAction(showToast)
  const [initialValues] = useState<PlaylistFormValues>(() => initialFormValues(initial))
  const [values, setValues] = useState<PlaylistFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const { markAllTouched, markTouched, touched } = useFormTouched<'title'>()

  const isDirty = !isEmpty(omitEqualFields(initialValues, values))

  const onChange = useCallback(
    <K extends keyof PlaylistFormValues>(key: K, value: PlaylistFormValues[K]) =>
      setValues(prev => ({ ...prev, [key]: value })),
    [],
  )

  const save = useCallback(async () => {
    markAllTouched(REQUIRED_FIELDS)
    if (values.title.trim().length === 0) {
      setError(TITLE_REQUIRED_MESSAGE)
      showToastAction(TITLE_REQUIRED_MESSAGE)
      return
    }

    setError(null)
    setIsSubmitting(true)
    const api = playlistsApi.getPlaylists()

    try {
      if (mode === 'edit') {
        await api.playlistControllerUpdate(id, buildUpdatePlaylistDto(values))
        showToastAction(UPDATE_SUCCESS_MESSAGE)
      } else {
        await api.playlistControllerCreate(buildCreatePlaylistDto(values))
        showToastAction(CREATE_SUCCESS_MESSAGE)
      }
      router.back()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }, [id, markAllTouched, mode, router, showToastAction, values])

  return { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values }
}
