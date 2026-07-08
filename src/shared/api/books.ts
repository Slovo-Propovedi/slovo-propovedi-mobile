import { type FetchedBooksGroupName } from '../model/domain/bible'
import { type SermonData } from '../model/domain/common'
import { localDB } from './localBD'

/**
 * Получить книги по группе.
 * @param tabName - Название группы книг.
 * @returns Книги группы или null.
 *
 * TODO: Заменить на вызов getAllSermons из Orval когда бэкенд будет готов.
 */
const getBooksOnBooksGroup = async (
  tabName: FetchedBooksGroupName,
): Promise<null | SermonData[]> => {
  const sermons = localDB.getBooks()
  const content = sermons.find(el => el.groupName === tabName)

  if (!content) return null

  return content.books

  // Реализация с бэкендом (когда будет готов):
  // const response = await getAllSermons()
  // return mapAllSermonsResponse(response)
}

export const booksAPI = {
  getBooksOnBooksGroup,
}
