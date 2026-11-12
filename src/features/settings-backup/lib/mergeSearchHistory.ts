import { type SearchHistory, sortAndCapSearchEntries } from 'entities/search-history'

/**
 * Объединяет импортированную историю поиска с локальной.
 *
 * При совпадении id проповеди побеждает запись с более свежим `savedAt`,
 * результат сортируется по убыванию времени и обрезается до лимита истории
 * поиска (переиспользуется инвариант `sortAndCapSearchEntries`).
 * @param local - Текущая история поиска устройства.
 * @param imported - История поиска из файла резервной копии.
 */
export const mergeSearchHistory = (local: SearchHistory, imported: SearchHistory): SearchHistory =>
  sortAndCapSearchEntries([...local, ...imported])
