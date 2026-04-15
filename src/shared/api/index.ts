import { booksAPI } from './books'

export * from './db'
export * from './generated'
export * from './youtube'

export const API = {
  books: booksAPI,
}
