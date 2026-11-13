import { act, waitFor } from '@testing-library/react-native'
import { type APITypes } from 'shared/api'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders } from 'shared/mocks'
import { usePreacherSermons } from './usePreacherSermons'

const mockFindAll = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockFindAll }) },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

// The hook renders the full entity graph; a cold Jest cache can exceed the
// default 15s per test.
jest.setTimeout(30_000)

const ARTIST = 'Иван Иванов'
const PAGE_SIZE = 20
const AUTO_CONTINUE_PAGE_LIMIT = 10

const buildSermon = (id: string, artist: string) =>
  sermonsMocks.getSermonControllerFindOneResponseMock({ artist, id })

const buildPage = (
  sermons: APITypes.SermonEntity[],
  nextCursor: null | string,
): APITypes.AllSermonsResponse =>
  sermonsMocks.getSermonControllerFindAllResponseMock({ nextCursor, sermons })

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })

  return { promise, resolve }
}

describe('usePreacherSermons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('is loading while the first page is in flight', async () => {
    const pending = deferred<APITypes.AllSermonsResponse>()
    mockFindAll.mockReturnValue(pending.promise)

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      pending.resolve(buildPage([buildSermon('first', ARTIST)], null))
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  test('loads the first page and keeps only exact-artist sermons', async () => {
    const exactCaseInsensitive = buildSermon('exact-1', `  ${ARTIST.toLowerCase()} `)
    const exact = buildSermon('exact-2', ARTIST)
    const longerName = buildSermon('longer', `${ARTIST} младший`)
    mockFindAll.mockResolvedValue(buildPage([exactCaseInsensitive, longerName, exact], null))

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.items.map(sermon => sermon.id)).toEqual(['exact-1', 'exact-2'])
    expect(result.current.hasMore).toBe(false)
    expect(mockFindAll).toHaveBeenCalledWith({ search: ARTIST, take: PAGE_SIZE })
  })

  test('appends the next cursor page and ends when the cursor is null', async () => {
    const first = buildSermon('first', ARTIST)
    const second = buildSermon('second', ARTIST)
    mockFindAll
      .mockResolvedValueOnce(buildPage([first], 'c1'))
      .mockResolvedValueOnce(buildPage([second], null))

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.items.map(sermon => sermon.id)).toEqual(['first', 'second'])
    expect(result.current.hasMore).toBe(false)
    expect(mockFindAll).toHaveBeenNthCalledWith(2, {
      cursor: 'c1',
      search: ARTIST,
      take: PAGE_SIZE,
    })
  })

  test('keeps paging while a page has no exact-artist matches', async () => {
    const unrelated = buildSermon('unrelated', 'Пётр Петров')
    const exact = buildSermon('exact', ARTIST)
    mockFindAll
      .mockResolvedValueOnce(buildPage([unrelated], 'c1'))
      .mockResolvedValueOnce(buildPage([exact], null))

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.items.map(sermon => sermon.id)).toEqual(['exact'])
    expect(mockFindAll).toHaveBeenCalledTimes(2)
    expect(mockFindAll).toHaveBeenNthCalledWith(2, {
      cursor: 'c1',
      search: ARTIST,
      take: PAGE_SIZE,
    })
  })

  test('caps one auto-continue run at ten pages', async () => {
    const unrelated = buildSermon('unrelated', 'Пётр Петров')
    mockFindAll.mockResolvedValue(buildPage([unrelated], 'always-more'))

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(mockFindAll).toHaveBeenCalledTimes(AUTO_CONTINUE_PAGE_LIMIT)
    expect(result.current.items).toEqual([])
    expect(result.current.hasMore).toBe(true)
  })

  test('flags a failed loadMore and recovers on retry', async () => {
    const first = buildSermon('first', ARTIST)
    const second = buildSermon('second', ARTIST)
    mockFindAll
      .mockResolvedValueOnce(buildPage([first], 'c1'))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(buildPage([second], null))

    const { result } = await renderHookWithProviders(() => usePreacherSermons(ARTIST))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(result.current.loadMoreFailed).toBe(false)
    expect(result.current.items.map(sermon => sermon.id)).toEqual(['first', 'second'])
  })
})
