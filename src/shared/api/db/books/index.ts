import { BibleBookName } from 'shared/types';
import { markBook } from './markBook';

export const booksDB = {
  [BibleBookName.Mark]: markBook,
};
