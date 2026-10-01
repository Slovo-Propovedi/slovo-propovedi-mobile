import { act, waitFor } from '@testing-library/react-native'
import { type APITypes } from 'shared/api'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { useSermonSearch } from './useSermonSearch'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })

  return { promise, resolve }
}

const buildSermon = (id: string) => sermonsMocks.getSermonControllerFindOneResponseMock({ id })

describe('useSermonSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('discards a loadMore response that arrives after the search term changed', async () => {
    const first = buildSermon('first')
    const stale = buildSermon('stale')
    const fresh = buildSermon('fresh')
    const pendingLoadMore = deferred<APITypes.AllSermonsResponse>()

    mockFindAll.mockImplementation(({ cursor, search }: { cursor?: string; search?: string }) => {
      if (cursor === 'cursor-1') return pendingLoadMore.promise
      if (search === 'new') return Promise.resolve({ count: 1, nextCursor: null, sermons: [fresh] })

      return Promise.resolve({ count: 2, nextCursor: 'cursor-1', sermons: [first] })
    })

    const { rerender, result } = await renderHookWithProviders(
      ({ search }: { search: string }) => useSermonSearch(search),
      { initialProps: { search: '' } },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      void result.current.loadMore()
    })

    rerender({ search: 'new' })

    await waitFor(() => expect(result.current.sermons.map(sermon => sermon.id)).toContain('fresh'))

    await act(async () => {
      pendingLoadMore.resolve({ count: 2, nextCursor: null, sermons: [stale] })
    })

    expect(result.current.sermons.map(sermon => sermon.id)).not.toContain('stale')
    expect(result.current.sermons.map(sermon => sermon.id)).toContain('fresh')
  })
})
