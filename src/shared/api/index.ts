import { booksAPI } from './books'
import { sermonsAPI } from './sermons'

export * from './db'
export * from './generated'
export * from './youtube'

export const API = {
  books: booksAPI,
  sermons: sermonsAPI,
}
