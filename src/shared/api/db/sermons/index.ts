import { BibleBookName } from '../types';
import { markBooks } from './markBooks';

export const sermonsDB = {
  [BibleBookName.Mark]: markBooks,
};
