import { BibleBookName } from 'shared/types';
import { markBook } from './markBook';

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
};
