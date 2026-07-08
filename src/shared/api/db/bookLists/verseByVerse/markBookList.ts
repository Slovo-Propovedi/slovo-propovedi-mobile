import { BibleBookName } from '../../../../model/domain/bible'
import { booksDB } from '../../books/booksDB'

export const markBookList = booksDB[BibleBookName.Mark]
