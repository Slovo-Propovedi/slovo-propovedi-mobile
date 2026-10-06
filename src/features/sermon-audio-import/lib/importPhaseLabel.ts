import { type ImportPhase, type ImportPhaseProgress } from './importTypes'

const PHASE_LABELS: Record<ImportPhase, string> = {
  download: 'Скачивание…',
  upload: 'Загрузка на сервер…',
}

// Тело запроса отправлено (100%), но сервер ещё принимает файл (MinIO ingest):
// подпись меняется, чтобы ожидание ответа не выглядело зависанием.
const PROCESSING_LABEL = 'Обработка на сервере…'
const COMPLETE_PERCENT = 100

const isServerProcessing = (progress: ImportPhaseProgress): boolean =>
  progress.phase === 'upload' && progress.percent >= COMPLETE_PERCENT

/**
 * Название фазы для скринридера/полосы прогресса: на завершённой загрузке
 * (100%) показывает ожидание ответа сервера.
 * @param progress - Текущий фазовый прогресс импорта.
 */
export const getImportPhaseLabel = (progress: ImportPhaseProgress): string =>
  isServerProcessing(progress) ? PROCESSING_LABEL : PHASE_LABELS[progress.phase]

/**
 * Подпись прогресса для текста: на завершённой загрузке (100%) без процента —
 * «Обработка на сервере…», иначе «<фаза> <процент>%».
 * @param progress - Текущий фазовый прогресс импорта.
 */
export const getImportProgressText = (progress: ImportPhaseProgress): string =>
  isServerProcessing(progress)
    ? PROCESSING_LABEL
    : `${PHASE_LABELS[progress.phase]} ${progress.percent}%`
