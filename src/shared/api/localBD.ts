import { type FetchedBooksGroupName } from '../model/domain/bible'
import { type SermonData } from '../model/domain/common'
import { db } from './db/db'

export const localDB = {
  getBooks: (): Array<{
    books: SermonData[]
    groupName: FetchedBooksGroupName
  }> => db.books,
}
