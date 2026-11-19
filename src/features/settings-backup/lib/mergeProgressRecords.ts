import { type SermonProgressRecord } from 'entities/listening-history'

/**
 * Сливает локальные progress-записи с кандидатами из резервной копии:
 * по каждому sermonId побеждает запись с более свежим `updatedAt`
 * (записи, которых локально нет, добавляются).
 * @param local - Записи текущего устройства.
 * @param candidates - Записи из файла (секция `sermonProgress` + деривация из каталога).
 */
export const mergeProgressRecords = (
  local: Record<string, SermonProgressRecord>,
  candidates: Record<string, SermonProgressRecord>,
): Record<string, SermonProgressRecord> => {
  const merged = { ...local }

  for (const [sermonId, record] of Object.entries(candidates)) {
    const current = merged[sermonId]
    if (!current || record.updatedAt > current.updatedAt) merged[sermonId] = record
  }

  return merged
}
