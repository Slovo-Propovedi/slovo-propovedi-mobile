import { booksAPI } from './books';
import { sermonsAPI } from './sermons';

export * from './db';

export * from './sermons';
export * from './youtube';

export const API = {
  books: booksAPI,
  sermons: sermonsAPI,
};
