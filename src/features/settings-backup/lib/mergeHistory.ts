import { type ListeningHistory, sortAndCapEntries } from 'entities/listening-history'

/**
 * Объединяет импортированную историю с локальной.
 *
 * При совпадении id проповеди побеждает запись с более свежим `lastPlayedAt`,
 * результат сортируется по убыванию времени и обрезается до лимита истории
 * (переиспользуется инвариант `sortAndCapEntries`).
 * @param local - Текущая история устройства.
 * @param imported - История из файла резервной копии.
 */
export const mergeHistory = (
  local: ListeningHistory,
  imported: ListeningHistory,
): ListeningHistory => sortAndCapEntries([...local, ...imported])
