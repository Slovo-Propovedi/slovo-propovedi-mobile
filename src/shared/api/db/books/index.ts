import { BibleBookName } from 'shared/model'
import { markBook } from './markBook'

export const booksDB = {
  [BibleBookName.Mark]: markBook,
}
