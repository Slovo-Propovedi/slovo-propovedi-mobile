import { act, waitFor } from '@testing-library/react-native'
import { mapAllSermonsResponse, type SermonData } from 'entities/sermon'
import { playlistsMocks, sermonsMocks } from 'shared/api/generated'
import { mockConsole, renderHookWithProviders } from 'shared/mocks'
import { usePagedSearch } from './usePagedSearch'

const mockSermonFindAll = jest.fn()
const mockPlaylistFindAll = jest.fn()
const mockGetCachedSearchResults = jest.fn()
const mockSetCachedSearchResults = jest.fn()
const mockGetCachedPlaylistSearch = jest.fn()
const mockSetCachedPlaylistSearch = jest.fn()

jest.mock('shared/api', () => ({
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockPlaylistFindAll }),
  },
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: mockSermonFindAll }),
  },
}))

// The feature barrel re-exports the player-coupled search UI; this pure hook
// test only needs the model/source surface.
jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(),
}))

jest.mock('features/sermon-search/lib/searchCache', () => ({
  getCachedSearchResults: (...args: unknown[]) => mockGetCachedSearchResults(...args),
  setCachedSearchResults: (...args: unknown[]) => mockSetCachedSearchResults(...args),
}))

jest.mock('features/sermon-search/lib/playlistSearchCache', () => ({
  getCachedPlaylistSearch: (...args: unknown[]) => mockGetCachedPlaylistSearch(...args),
  setCachedPlaylistSearch: (...args: unknown[]) => mockSetCachedPlaylistSearch(...args),
}))

jest.setTimeout(30_000)

type PlaylistEntity = ReturnType<typeof playlistsMocks.getPlaylistControllerCreateResponseMock>
type SermonEntity = ReturnType<typeof sermonsMocks.getSermonControllerFindOneResponseMock>

const buildSermonPage = (sermons: SermonEntity[], nextCursor: null | string = null) =>
  sermonsMocks.getSermonControllerFindAllResponseMock({ nextCursor, sermons })

const buildPlaylistPage = (playlists: PlaylistEntity[], count: number) =>
  playlistsMocks.getPlaylistControllerFindAllResponseMock({ count, playlists })

const buildSermonData = (sermon: SermonEntity): SermonData =>
  mapAllSermonsResponse(buildSermonPage([sermon]))[0]

const QUERY = 'вера'

describe('usePagedSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSermonFindAll.mockResolvedValue(buildSermonPage([]))
    mockPlaylistFindAll.mockResolvedValue(buildPlaylistPage([], 0))
    mockGetCachedSearchResults.mockResolvedValue(undefined)
    mockSetCachedSearchResults.mockResolvedValue(undefined)
    mockGetCachedPlaylistSearch.mockResolvedValue(undefined)
    mockSetCachedPlaylistSearch.mockResolvedValue(undefined)
  })

  test('does not fetch below the minimum query length', async () => {
    const { result } = await renderHookWithProviders(() => usePagedSearch('в'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
    })

    expect(mockSermonFindAll).not.toHaveBeenCalled()
    expect(mockPlaylistFindAll).not.toHaveBeenCalled()
    expect(result.current.sermons).toMatchObject({ hasMore: false, isLoading: false, items: [] })
  })

  test('fetches both groups after the debounce and derives preachers from sermons', async () => {
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock({ artist: 'Вера' })
    const other = sermonsMocks.getSermonControllerFindOneResponseMock({ artist: 'Пётр' })
    const playlist = playlistsMocks.getPlaylistControllerCreateResponseMock()
    mockSermonFindAll.mockResolvedValue(buildSermonPage([sermon, other]))
    mockPlaylistFindAll.mockResolvedValue(buildPlaylistPage([playlist], 1))

    const { result } = await renderHookWithProviders(() => usePagedSearch(QUERY))

    await waitFor(() => expect(result.current.sermons.items).toHaveLength(2))

    expect(mockSermonFindAll).toHaveBeenCalledWith({ search: QUERY, take: 20 })
    expect(mockPlaylistFindAll).toHaveBeenCalledWith({ limit: 20, page: 1, search: QUERY })
    expect(result.current.playlists.items.map(item => item.id)).toEqual([playlist.id])
    expect(result.current.preachers.items).toEqual(['Вера'])
  })

  test('caches the first network page', async () => {
    mockSermonFindAll.mockResolvedValue(
      buildSermonPage([sermonsMocks.getSermonControllerFindOneResponseMock()]),
    )

    await renderHookWithProviders(() => usePagedSearch(QUERY))

    await waitFor(() => expect(mockSetCachedSearchResults).toHaveBeenCalled())
  })

  test('loads the next sermon page through the cursor and appends it', async () => {
    const first = sermonsMocks.getSermonControllerFindOneResponseMock({ artist: 'Иван' })
    const second = sermonsMocks.getSermonControllerFindOneResponseMock({ artist: 'Пётр' })
    mockSermonFindAll
      .mockResolvedValueOnce(buildSermonPage([first], 'cursor-1'))
      .mockResolvedValueOnce(buildSermonPage([second]))

    const { result } = await renderHookWithProviders(() => usePagedSearch(QUERY))
    await waitFor(() => expect(result.current.sermons.items).toHaveLength(1))
    expect(result.current.sermons.hasMore).toBe(true)

    await act(async () => {
      result.current.sermons.loadMore()
    })

    await waitFor(() => expect(result.current.sermons.items).toHaveLength(2))
    expect(mockSermonFindAll).toHaveBeenLastCalledWith({
      cursor: 'cursor-1',
      search: QUERY,
      take: 20,
    })
    expect(result.current.sermons.items.map(item => item.id)).toEqual([first.id, second.id])
    expect(result.current.sermons.hasMore).toBe(false)
  })

  test('loads the next playlist page and stops when the count is reached', async () => {
    const first = playlistsMocks.getPlaylistControllerCreateResponseMock()
    const second = playlistsMocks.getPlaylistControllerCreateResponseMock()
    const third = playlistsMocks.getPlaylistControllerCreateResponseMock()
    mockPlaylistFindAll
      .mockResolvedValueOnce(buildPlaylistPage([first, second], 3))
      .mockResolvedValueOnce(buildPlaylistPage([third], 3))

    const { result } = await renderHookWithProviders(() => usePagedSearch(QUERY))
    await waitFor(() => expect(result.current.playlists.items).toHaveLength(2))
    expect(result.current.playlists.hasMore).toBe(true)

    await act(async () => {
      result.current.playlists.loadMore()
    })

    await waitFor(() => expect(result.current.playlists.items).toHaveLength(3))
    expect(mockPlaylistFindAll).toHaveBeenLastCalledWith({ limit: 20, page: 2, search: QUERY })
    expect(result.current.playlists.hasMore).toBe(false)
  })

  test('falls back to the cached first sermon page when the network fails', async () => {
    mockConsole('error')
    const cached = buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock())
    mockSermonFindAll.mockRejectedValue(new Error('offline'))
    mockGetCachedSearchResults.mockResolvedValue([cached])

    const { result } = await renderHookWithProviders(() => usePagedSearch(QUERY))

    await waitFor(() => expect(result.current.sermons.items).toHaveLength(1))
    expect(result.current.sermons.items[0].id).toBe(cached.id)
    expect(result.current.sermons.hasMore).toBe(false)
  })

  test('drops a stale response from an older query', async () => {
    const fresh = sermonsMocks.getSermonControllerFindOneResponseMock()
    const stale = sermonsMocks.getSermonControllerFindOneResponseMock()
    let resolveFirst!: (value: unknown) => void
    mockSermonFindAll
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce(buildSermonPage([fresh]))

    const { rerender, result } = await renderHookWithProviders(
      ({ query }: { query: string }) => usePagedSearch(query),
      { initialProps: { query: 'вера' } },
    )
    await waitFor(() => expect(mockSermonFindAll).toHaveBeenCalledTimes(1))

    await rerender({ query: 'любовь' })
    await waitFor(() => expect(result.current.sermons.items[0]?.id).toBe(fresh.id))

    resolveFirst(buildSermonPage([stale]))
    await act(async () => {})

    expect(result.current.sermons.items.map(item => item.id)).toEqual([fresh.id])
  })
})
