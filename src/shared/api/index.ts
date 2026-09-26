import { booksAPI } from './books'

export * from './db/constants'
export * from './db/db'
export * from './generated'

export const API = {
  books: booksAPI,
}
