import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { usePaginatedList } from './usePaginatedList'

const mockFetchPage = jest.fn()

jest.mock('../../model/error-dialog', () => ({ reportError: jest.fn() }))

// useFocusEffect: capture the latest callback so tests can simulate a re-focus.
let mockFocusCallback: () => void = () => {}
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    mockFocusCallback = callback
    useEffect(callback, [callback])
  },
}))

const PAGE_SIZE = 2

const renderList = () =>
  renderHookWithProviders(() =>
    usePaginatedList({
      errorMessage: 'Ошибка загрузки',
      fetchPage: mockFetchPage,
      pageSize: PAGE_SIZE,
    }),
  )

describe('usePaginatedList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('loads the first page on mount', async () => {
    mockFetchPage.mockResolvedValueOnce(['a', 'b'])

    const { result } = await renderList()

    await act(async () => {})

    expect(result.current.items).toEqual(['a', 'b'])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(mockFetchPage).toHaveBeenCalledWith(1)
  })

  test('reloads silently on focus and clears a failed loadMore flag', async () => {
    mockFetchPage
      .mockResolvedValueOnce(['a', 'b'])
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(['c', 'd'])

    const { result } = await renderList()
    await act(async () => {})

    await act(async () => {
      await result.current.loadMore()
    })
    expect(result.current.loadMoreFailed).toBe(true)

    await act(async () => {
      mockFocusCallback()
    })
    await act(async () => {})

    expect(result.current.loadMoreFailed).toBe(false)
    expect(result.current.items).toEqual(['c', 'd'])
    expect(result.current.isLoading).toBe(false)
  })

  test('ignores loadMore while a silent focus refresh is in flight', async () => {
    mockFetchPage.mockResolvedValueOnce(['a', 'b'])

    const { result } = await renderList()
    await act(async () => {})

    let resolveRefresh: (ids: string[]) => void = () => {}
    mockFetchPage.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve
      }),
    )

    await act(async () => {
      mockFocusCallback()
    })

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockFetchPage).toHaveBeenCalledTimes(2)
    expect(result.current.items).toEqual(['a', 'b'])

    await act(async () => {
      resolveRefresh(['c', 'd'])
    })
  })

  test('refresh reloads the first page and drives the isRefreshing spinner', async () => {
    mockFetchPage.mockResolvedValueOnce(['a', 'b'])

    const { result } = await renderList()
    await act(async () => {})

    let resolveRefresh: (ids: string[]) => void = () => {}
    mockFetchPage.mockReturnValueOnce(
      new Promise(resolve => {
        resolveRefresh = resolve
      }),
    )

    await act(async () => {
      void result.current.refresh()
    })

    expect(result.current.isRefreshing).toBe(true)
    expect(mockFetchPage).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveRefresh(['c', 'd'])
    })

    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.items).toEqual(['c', 'd'])
  })
})
