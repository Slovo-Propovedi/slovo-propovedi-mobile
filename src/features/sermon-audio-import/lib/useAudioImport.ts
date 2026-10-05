import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { importAudio } from './importAudio'
import {
  type ImportedSermonData,
  type ImportPhaseProgress,
  type ImportSettings,
} from './importTypes'
import { getImportErrorMessage } from './sourceErrors'

const SUCCESS_MESSAGE = 'Импортировано из YouTube'

/**
 * Импорт аудио и метаданных в форму проповеди: держит фазовый прогресс, отменяет
 * скачивание при размонтировании, показывает результат (успех — toast, ошибка —
 * глобальный диалог с копируемыми деталями) и отдаёт подставленные в форму данные
 * наверх.
 * @param props - Аргументы импорта.
 * @param props.onImported - Получает аудио URL, заголовок и описание для формы.
 * @param props.settings - Источник и адрес инстанса Invidious.
 * @param props.url - Ссылка или ID видео YouTube из поля формы.
 */
export const useAudioImport = ({
  onImported,
  settings,
  url,
}: {
  onImported: (data: ImportedSermonData) => void
  settings: ImportSettings
  url: string
}) => {
  const showToastAction = useAction(showToast)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportPhaseProgress | null>(null)
  const abortController = useRef<AbortController | null>(null)

  useEffect(
    () => () => {
      // Размонтирование не должно оставлять скачивание в фоне.
      abortController.current?.abort()
    },
    [],
  )

  const startImport = useCallback(async () => {
    if (isImporting) return

    const controller = new AbortController()
    abortController.current = controller
    // Импорт начался до первого отчёта источника: UI показывает «Поиск видео…»,
    // пока фаза неизвестна.
    setIsImporting(true)
    setProgress(null)

    try {
      const data = await importAudio({
        onPhase: setProgress,
        settings,
        signal: controller.signal,
        url,
      })
      // Загрузка файла не отменяется, поэтому успех может прийти после размонтирования:
      // toast и подстановку в форму в этом случае показывать уже некому.
      if (controller.signal.aborted) return
      showToastAction(SUCCESS_MESSAGE)
      onImported(data)
    } catch (error) {
      // Отменённый размонтированием импорт не показываем пользователю.
      if (controller.signal.aborted) return
      reportError(error, getImportErrorMessage(error))
    } finally {
      if (abortController.current === controller) abortController.current = null
      setIsImporting(false)
      setProgress(null)
    }
  }, [isImporting, onImported, settings, showToastAction, url])

  return { isImporting, progress, startImport }
}
