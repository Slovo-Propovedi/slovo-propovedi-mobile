const mockSermonControllerFindAll = jest.fn()
const mockGetCachedSearchResults = jest.fn()
const mockSetCachedSearchResults = jest.fn()

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.requireActual('shared/api/mappers/mapAllSermonsResponse')
    .mapAllSermonsResponse,
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: mockSermonControllerFindAll,
    }),
  },
}))

jest.mock('./lib/searchCache', () => ({
  getCachedSearchResults: (...args: unknown[]) => mockGetCachedSearchResults(...args),
  setCachedSearchResults: (...args: unknown[]) => mockSetCachedSearchResults(...args),
}))

import { createCtx } from '@reatom/framework'
import {
  closeSearch,
  fetchSearchResults,
  isSearchingAtom,
  isSearchOpenAtom,
  openSearch,
  resetSearchResults,
  searchQueryAtom,
  searchResultsAtom,
} from './model'

const sermonEntity = {
  artist: 'Тестовый артист',
  artwork: 'https://example.com/artwork.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  book: null,
  chapter: null,
  description: 'Описание проповеди',
  id: 'sermon-1',
  playlists: [],
  textFileUrl: null,
  title: 'Проповедь о вере',
  verse: null,
  youtubeUrl: null,
}

describe('sermon-search model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetCachedSearchResults.mockResolvedValue(undefined)
    mockSetCachedSearchResults.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('fetchSearchResults maps results and updates atoms', async () => {
    mockSermonControllerFindAll.mockResolvedValue({
      count: 1,
      nextCursor: null,
      sermons: [sermonEntity],
    })
    const ctx = createCtx()

    await fetchSearchResults(ctx, '  вера  ')

    expect(mockSermonControllerFindAll).toHaveBeenCalledWith({ search: 'вера', take: 20 })
    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe('sermon-1')
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults writes successful results to the cache', async () => {
    mockSermonControllerFindAll.mockResolvedValue({
      count: 1,
      nextCursor: null,
      sermons: [sermonEntity],
    })
    const ctx = createCtx()

    await fetchSearchResults(ctx, 'вера')

    expect(mockSetCachedSearchResults).toHaveBeenCalledWith(
      'вера',
      expect.arrayContaining([expect.objectContaining({ id: 'sermon-1' })]),
    )
  })

  test('fetchSearchResults falls back to the cache on network error', async () => {
    mockSermonControllerFindAll.mockRejectedValue(new Error('network down'))
    mockGetCachedSearchResults.mockResolvedValue([{ ...sermonEntity, id: 'cached-1' }])
    const ctx = createCtx()

    await fetchSearchResults(ctx, 'вера')

    expect(mockGetCachedSearchResults).toHaveBeenCalledWith('вера')
    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe('cached-1')
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults clears results on network error without cache', async () => {
    mockSermonControllerFindAll.mockRejectedValue(new Error('network down'))
    const ctx = createCtx()

    await fetchSearchResults(ctx, 'вера')

    expect(mockGetCachedSearchResults).toHaveBeenCalledWith('вера')
    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults resets state for an empty query', async () => {
    mockSermonControllerFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })
    const ctx = createCtx()
    searchResultsAtom(ctx, [{ ...sermonEntity }])
    isSearchingAtom(ctx, true)

    await fetchSearchResults(ctx, '   ')

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(mockSermonControllerFindAll).not.toHaveBeenCalled()
  })

  test('fetchSearchResults ignores a stale response from an older request', async () => {
    let resolveFirst!: (value: unknown) => void
    let resolveSecond!: (value: unknown) => void
    mockSermonControllerFindAll
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSecond = resolve
          }),
      )
    const ctx = createCtx()

    const firstRequest = fetchSearchResults(ctx, 'вера')
    await Promise.resolve()
    const secondRequest = fetchSearchResults(ctx, 'любовь')
    await Promise.resolve()

    resolveSecond({ count: 1, nextCursor: null, sermons: [{ ...sermonEntity, id: 'sermon-2' }] })
    await secondRequest

    resolveFirst({ count: 1, nextCursor: null, sermons: [sermonEntity] })
    await firstRequest

    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe('sermon-2')
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults ignores a stale cache fallback from an older request', async () => {
    let resolveCache!: (value: unknown) => void
    mockSermonControllerFindAll
      .mockImplementationOnce(() => Promise.reject(new Error('network down')))
      .mockImplementationOnce(() =>
        Promise.resolve({
          count: 1,
          nextCursor: null,
          sermons: [{ ...sermonEntity, id: 'sermon-2' }],
        }),
      )
    mockGetCachedSearchResults.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveCache = resolve
        }),
    )
    const ctx = createCtx()

    const firstRequest = fetchSearchResults(ctx, 'вера')
    // Flush the schedule and the network rejection so the cache read starts
    await Promise.resolve()
    await Promise.resolve()
    expect(resolveCache).toBeDefined()

    const secondRequest = fetchSearchResults(ctx, 'любовь')
    await Promise.resolve()

    await secondRequest
    expect(ctx.get(searchResultsAtom)[0].id).toBe('sermon-2')

    resolveCache([{ ...sermonEntity, id: 'stale' }])
    await firstRequest

    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe('sermon-2')
  })

  test('resetSearchResults resets results and the searching flag', async () => {
    const ctx = createCtx()
    searchResultsAtom(ctx, [{ ...sermonEntity }])
    isSearchingAtom(ctx, true)

    await resetSearchResults(ctx)

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('resetSearchResults cancels an in-flight request so its stale result is dropped', async () => {
    let resolveRequest!: (value: unknown) => void
    mockSermonControllerFindAll.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve
        }),
    )
    const ctx = createCtx()

    const request = fetchSearchResults(ctx, 'вера')
    await Promise.resolve()

    await resetSearchResults(ctx)

    resolveRequest({ count: 1, nextCursor: null, sermons: [sermonEntity] })
    await request

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(mockSetCachedSearchResults).not.toHaveBeenCalled()
  })

  test('closeSearch cancels an in-flight request so its stale result is dropped', async () => {
    let resolveRequest!: (value: unknown) => void
    mockSermonControllerFindAll.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve
        }),
    )
    const ctx = createCtx()

    const request = fetchSearchResults(ctx, 'вера')
    await Promise.resolve()

    await closeSearch(ctx)

    resolveRequest({ count: 1, nextCursor: null, sermons: [sermonEntity] })
    await request

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(mockSetCachedSearchResults).not.toHaveBeenCalled()
  })

  test('openSearch opens the search and closeSearch resets all search state', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, [{ ...sermonEntity }])
    isSearchingAtom(ctx, true)

    await openSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(true)

    await closeSearch(ctx)

    expect(ctx.get(isSearchOpenAtom)).toBe(false)
    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })
})
