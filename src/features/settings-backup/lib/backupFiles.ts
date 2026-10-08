import {
  AUTO_BACKUP_FILE_NAME,
  MANUAL_BACKUP_EXTENSION,
  MANUAL_BACKUP_PREFIX,
} from '../model/backupScalars'

const pad = (value: number): string => String(value).padStart(2, '0')

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

const isManualBackupFileName = (name: string): boolean =>
  name.startsWith(MANUAL_BACKUP_PREFIX) &&
  name.endsWith(MANUAL_BACKUP_EXTENSION) &&
  name !== AUTO_BACKUP_FILE_NAME

/**
 * Выбирает самый свежий ручной бэкап из списка имён в папке.
 * @param names - Имена файлов в выбранной папке.
 * @returns Имя самого нового ручного бэкапа или `null`, если таких файлов нет.
 */
export const pickNewestManualBackupName = (names: string[]): null | string => {
  const manualNames = names.filter(isManualBackupFileName).sort((a, b) => b.localeCompare(a))
  return manualNames[0] ?? null
}
