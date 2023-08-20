import { BibleBookName } from 'entities';
import { markBook } from './markBook';

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
};
