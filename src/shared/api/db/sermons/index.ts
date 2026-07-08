import { BibleBookName } from '../../../model/domain/bible'
import { markBook } from './markBook'

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
}
