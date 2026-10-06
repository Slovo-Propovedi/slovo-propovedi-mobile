import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { importAudio } from './importAudio'
import {
  type ImportedSermonMetadata,
  type ImportPhaseProgress,
  type ImportSettings,
} from './importTypes'
import { getImportErrorMessage, ImportSourceError } from './sourceErrors'

const IMPORTED_MESSAGE = 'Импортировано из YouTube'
const METADATA_MESSAGE = 'Название и описание заполнены'

// Сбои загрузки файла и неожиданные ошибки требуют диагностики: их детали
// (стек, статус) копируются из диалога. Известные пользовательские причины
// (битая ссылка, нет аудио, антибот и т. п.) решаются сменой ссылки/инстанса —
// им достаточно короткого toast'а.
const DIAGNOSTIC_CODES: readonly ImportSourceError['code'][] = ['upload-failed']

/**
 * Импорт аудио и метаданных в форму проповеди: держит фазовый прогресс, отменяет
 * скачивание при размонтировании, показывает результат (успех — toast, известные
 * сбои — toast, диагностические — глобальный диалог с копируемыми деталями) и
 * отдаёт подставленные в форму данные наверх.
 *
 * Метаданные уходят в форму сразу после разбора ссылки; аудио скачивается и
 * загружается только когда в форме ещё нет файла (`hasAudio`).
 * @param props - Аргументы импорта.
 * @param props.hasAudio - В форме уже есть аудиофайл: скачивание пропускается.
 * @param props.onAudioImported - Получает URL загруженного аудио (после загрузки).
 * @param props.onMetadata - Получает название и описание сразу после разбора ссылки.
 * @param props.settings - Источник и адрес инстанса Invidious.
 * @param props.url - Ссылка или ID видео YouTube из поля формы.
 */
export const useAudioImport = ({
  hasAudio,
  onAudioImported,
  onMetadata,
  settings,
  url,
}: {
  hasAudio: boolean
  onAudioImported: (audioUrl: string) => void
  onMetadata: (metadata: ImportedSermonMetadata) => void
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
        onMetadata: metadata => {
          // Размонтирование между разбором ссылки и подстановкой — формы уже нет.
          if (controller.signal.aborted) return
          onMetadata(metadata)
        },
        onPhase: setProgress,
        settings,
        signal: controller.signal,
        url,
        withAudio: !hasAudio,
      })
      // Загрузка файла не отменяется, поэтому успех может прийти после размонтирования:
      // toast и подстановку в форму в этом случае показывать уже некому.
      if (controller.signal.aborted) return

      if (data.audioUrl === null) {
        showToastAction(METADATA_MESSAGE)
        return
      }

      showToastAction(IMPORTED_MESSAGE)
      onAudioImported(data.audioUrl)
    } catch (error) {
      // Отменённый размонтированием импорт не показываем пользователю.
      if (controller.signal.aborted) return
      const message = getImportErrorMessage(error)

      if (error instanceof ImportSourceError && !DIAGNOSTIC_CODES.includes(error.code)) {
        showToastAction(message)
        return
      }

      reportError(error, message)
    } finally {
      if (abortController.current === controller) abortController.current = null
      setIsImporting(false)
      setProgress(null)
    }
  }, [hasAudio, isImporting, onAudioImported, onMetadata, settings, showToastAction, url])

  return { isImporting, progress, startImport }
}
