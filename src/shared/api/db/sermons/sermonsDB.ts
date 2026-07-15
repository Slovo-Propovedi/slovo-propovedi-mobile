import { BibleBookName } from '../bibleBookNames'
import { markBook } from './markBook'

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
}
