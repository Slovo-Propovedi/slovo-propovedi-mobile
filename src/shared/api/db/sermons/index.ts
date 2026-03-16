import { BibleBookName } from 'shared/model'
import { markBook } from './markBook'

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
}
