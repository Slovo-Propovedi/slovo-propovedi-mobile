import { renderHook } from '@testing-library/react-native'
import { type BookData } from '../model/domain/common'
import { useReadNavigation } from './useReadNavigation'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockBook: BookData = {
  artist: 'Test Artist',
  artwork: 'https://example.com/artwork.jpg',
  id: '1',
  title: 'Test Book',
}

describe('useReadNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('navigateToBookReader calls router.push with correct pathname', async () => {
    const { result } = await renderHook(() => useReadNavigation())
    result.current.navigateToBookReader(mockBook)

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/read/book-reader' }),
    )
  })

  test('navigateToBookReader serializes book to JSON in params', async () => {
    const { result } = await renderHook(() => useReadNavigation())
    result.current.navigateToBookReader(mockBook)

    const calledWith = mockPush.mock.calls[0][0]
    expect(calledWith.params.book).toBe(JSON.stringify(mockBook))
  })

  test('navigateToBooksList calls router.push with correct pathname', async () => {
    const { result } = await renderHook(() => useReadNavigation())
    result.current.navigateToBooksList([mockBook], 'My Books')

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/read/books-list' }))
  })

  test('navigateToBooksList serializes books array and passes title', async () => {
    const { result } = await renderHook(() => useReadNavigation())
    const books = [mockBook]
    result.current.navigateToBooksList(books, 'My Books')

    const calledWith = mockPush.mock.calls[0][0]
    expect(calledWith.params.books).toBe(JSON.stringify(books))
    expect(calledWith.params.title).toBe('My Books')
  })
})
