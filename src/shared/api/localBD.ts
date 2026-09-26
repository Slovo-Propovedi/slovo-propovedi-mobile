import { type SermonShape } from '../model/domain/common'
import { db } from './db/db'

interface LocalDBBookGroup {
  books: SermonShape[]
  groupName: string
}

export const localDB = {
  getBooks: (): LocalDBBookGroup[] => db.books,
  getBooksByGroup: (groupName: string): SermonShape[] | undefined =>
    db.books.find(item => item.groupName === groupName)?.books,
}
