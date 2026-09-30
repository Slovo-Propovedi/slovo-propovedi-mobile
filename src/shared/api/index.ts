import { booksAPI } from './books'

export * from './generated'

export { secureTokenStorage } from './secureTokenStorage'

export const API = {
  books: booksAPI,
}
