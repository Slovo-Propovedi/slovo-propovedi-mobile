import { BibleBookName } from '../bibleBookNames'
import { markBook } from './markBook'

export const booksDB = {
  [BibleBookName.Mark]: markBook,
}
