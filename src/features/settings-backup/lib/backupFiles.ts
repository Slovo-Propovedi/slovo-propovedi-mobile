import {
  AUTO_BACKUP_FILE_NAME,
  MANUAL_BACKUP_EXTENSION,
  MANUAL_BACKUP_PREFIX,
} from '../model/backupScalars'

const pad = (value: number): string => String(value).padStart(2, '0')

const MANUAL_NAME_PATTERN = /^slovo-backup-(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})\.json$/
const AUTO_LABEL = `Автосинхронизация · ${AUTO_BACKUP_FILE_NAME}`
const AUTO_SORT_KEY = Number.POSITIVE_INFINITY

/** Файл резервной копии, доступный для выбора при импорте. */
export interface BackupFileOption {
  fileName: string
  label: string
}

interface BackupFileCandidate extends BackupFileOption {
  sortKey: number
}

/**
 * Имя ручной резервной копии: `slovo-backup-YYYY-MM-DD_HH-MM.json`.
 *
 * Нулевое дополнение делает лексикографический порядок равным хронологическому,
 * поэтому «самый свежий» файл — просто максимальное имя.
 * @param date - Момент экспорта.
 */
export const buildManualBackupFileName = (date: Date): string => {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}`

  return `${MANUAL_BACKUP_PREFIX}${datePart}_${timePart}${MANUAL_BACKUP_EXTENSION}`
}

const parseManualBackupDate = (name: string): Date | null => {
  const match = MANUAL_NAME_PATTERN.exec(name)
  if (!match) return null

  const [, year, month, day, hour, minute] = match
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
}

const formatBackupDate = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`

/**
 * Собирает список доступных файлов резервных копий из имён в папке.
 *
 * Автофайл идёт первым (подпись «Автосинхронизация» + имя), ручные — по убыванию
 * распарсенной из имени даты. Посторонние имена игнорируются.
 * @param names - Имена файлов в выбранной папке.
 * @returns Опции для диалога выбора (файл + подпись).
 */
export const listBackupFileOptions = (names: string[]): BackupFileOption[] => {
  const candidates = names.flatMap<BackupFileCandidate>(name => {
    if (name === AUTO_BACKUP_FILE_NAME)
      return [{ fileName: name, label: AUTO_LABEL, sortKey: AUTO_SORT_KEY }]

    const date = parseManualBackupDate(name)
    if (!date) return []

    return [{ fileName: name, label: formatBackupDate(date), sortKey: date.getTime() }]
  })

  return candidates
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(({ fileName, label }) => ({ fileName, label }))
}
