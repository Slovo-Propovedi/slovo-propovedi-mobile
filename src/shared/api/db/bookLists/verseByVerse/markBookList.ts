import { booksDB } from 'shared/api/db/books'
import { BibleBookName } from 'shared/types'

export const markBookList = booksDB[BibleBookName.Mark]
