import { useAction } from '@reatom/npm-react'
import { useState } from 'react'
import { InvidiousInstanceError, validateInvidiousInstance } from 'features/sermon-audio-import'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { type AddInstanceResult, INSTANCE_URL_PREFIX, validateInstanceUrl } from './instanceUrl'

const PROBE_ERROR_MESSAGE = 'Не удалось проверить доступ по API к инстансу'

const ADD_ERRORS: Record<Exclude<AddInstanceResult, 'ok'>, string> = {
  duplicate: 'Такой инстанс уже добавлен',
  invalid: `Адрес должен начинаться с ${INSTANCE_URL_PREFIX}`,
}

/**
 * Поток добавления инстанса: формат адреса, клиентская проверка API и сохранение.
 * Пока проверка в полёте, повторные нажатия игнорируются (single-flight). Известный
 * сбой API показывается toast'ом с причиной; неизвестный уходит в копируемый диалог.
 * @param props - Зависимости потока добавления.
 * @param props.addAndSave - Добавляет адрес в список и сохраняет его (`PUT`).
 * @param props.instances - Текущий список адресов (для проверки дублей).
 */
export const useAddInstance = ({
  addAndSave,
  instances,
}: {
  addAndSave: (url: string) => Promise<void>
  instances: string[]
}) => {
  const showToastAction = useAction(showToast)
  const [draft, setDraft] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleAdd = async () => {
    if (isValidating) return

    const result = validateInstanceUrl(draft, instances)
    if (result !== 'ok') {
      showToastAction(ADD_ERRORS[result])
      return
    }

    setIsValidating(true)
    try {
      await validateInvidiousInstance(draft.trim())
      await addAndSave(draft)
      setDraft('')
    } catch (error) {
      if (error instanceof InvidiousInstanceError) showToastAction(error.message)
      else reportError(error, PROBE_ERROR_MESSAGE)
    } finally {
      setIsValidating(false)
    }
  }

  return { draft, handleAdd, isValidating, setDraft }
}
