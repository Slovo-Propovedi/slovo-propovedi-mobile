import { booksDB } from 'shared/api/db/books'
import { BibleBookName } from 'shared/model'

export const markBookList = booksDB[BibleBookName.Mark]
