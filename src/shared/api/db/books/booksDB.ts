import { BibleBookName } from '../../../model/domain/bible'
import { markBook } from './markBook'

export const booksDB = {
  [BibleBookName.Mark]: markBook,
}
