import { type SermonShape } from '../model/domain/common'
import { localDB } from './localBD'

/**
 * Получить книги по группе.
 * @param tabName - Название группы книг.
 * @returns Структурные данные группы или null. Валидация в доменный
 * `BookData`/`SermonData` выполняется парсерами entities/sermon у потребителей.
 *
 * TODO: Заменить на вызов getAllSermons из Orval когда бэкенд будет готов.
 */
const getBooksOnBooksGroup = async (tabName: string): Promise<null | SermonShape[]> =>
  localDB.getBooksByGroup(tabName) ?? null

export const booksAPI = {
  getBooksOnBooksGroup,
}
