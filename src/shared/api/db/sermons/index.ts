import { BibleBookName } from '../types';
import { markBook } from './markBook';

export const sermonsDB = {
  [BibleBookName.Mark]: markBook,
};
