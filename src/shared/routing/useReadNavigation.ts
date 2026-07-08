import { useRouter } from 'expo-router'
import { type BookData } from '../model/domain/common'

export const useReadNavigation = () => {
  const router = useRouter()

  const navigateToBookReader = (book: BookData) => {
    router.push({
      params: { book: JSON.stringify(book) },
      pathname: '/read/book-reader',
    })
  }

  const navigateToBooksList = (books: BookData[], title: string) => {
    router.push({
      params: { books: JSON.stringify(books), title },
      pathname: '/read/books-list',
    })
  }

  return {
    navigateToBookReader,
    navigateToBooksList,
  }
}
