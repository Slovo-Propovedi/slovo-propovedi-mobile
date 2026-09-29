const mockSermonControllerFindAll = jest.fn()
const mockGetCachedSearchResults = jest.fn()
const mockSetCachedSearchResults = jest.fn()

jest.mock('shared/api', () => ({
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
import { mapAllSermonsResponse } from 'entities/sermon'
import { sermonsMocks } from 'shared/api/generated'
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

type SermonEntity = ReturnType<typeof sermonsMocks.getSermonControllerFindOneResponseMock>

const buildSermonsResponse = (sermons: SermonEntity[]) =>
  sermonsMocks.getSermonControllerFindAllResponseMock({ sermons })

const buildSermonData = (sermon: SermonEntity) =>
  mapAllSermonsResponse(buildSermonsResponse([sermon]))[0]

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
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))
    const ctx = createCtx()

    await fetchSearchResults(ctx, '  вера  ')

    expect(mockSermonControllerFindAll).toHaveBeenCalledWith({ search: 'вера', take: 20 })
    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe(sermon.id)
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults writes successful results to the cache', async () => {
    const sermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    mockSermonControllerFindAll.mockResolvedValue(buildSermonsResponse([sermon]))
    const ctx = createCtx()

    await fetchSearchResults(ctx, 'вера')

    expect(mockSetCachedSearchResults).toHaveBeenCalledWith(
      'вера',
      expect.arrayContaining([expect.objectContaining({ id: sermon.id })]),
    )
  })

  test('fetchSearchResults falls back to the cache on network error', async () => {
    const cachedSermon = {
      ...buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock()),
      id: 'cached-1',
    }
    mockSermonControllerFindAll.mockRejectedValue(new Error('network down'))
    mockGetCachedSearchResults.mockResolvedValue([cachedSermon])
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
    mockSermonControllerFindAll.mockResolvedValue(
      sermonsMocks.getSermonControllerFindAllResponseMock({
        count: 0,
        nextCursor: null,
        sermons: [],
      }),
    )
    const ctx = createCtx()
    searchResultsAtom(ctx, [buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock())])
    isSearchingAtom(ctx, true)

    await fetchSearchResults(ctx, '   ')

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(mockSermonControllerFindAll).not.toHaveBeenCalled()
  })

  test('fetchSearchResults ignores a stale response from an older request', async () => {
    const staleSermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    const freshSermon = sermonsMocks.getSermonControllerFindOneResponseMock()
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

    resolveSecond(buildSermonsResponse([freshSermon]))
    await secondRequest

    resolveFirst(buildSermonsResponse([staleSermon]))
    await firstRequest

    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe(freshSermon.id)
    expect(ctx.get(isSearchingAtom)).toBe(false)
  })

  test('fetchSearchResults ignores a stale cache fallback from an older request', async () => {
    const freshSermon = sermonsMocks.getSermonControllerFindOneResponseMock()
    let resolveCache!: (value: unknown) => void
    mockSermonControllerFindAll
      .mockImplementationOnce(() => Promise.reject(new Error('network down')))
      .mockImplementationOnce(() => Promise.resolve(buildSermonsResponse([freshSermon])))
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
    expect(ctx.get(searchResultsAtom)[0].id).toBe(freshSermon.id)

    resolveCache([
      { ...buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock()), id: 'stale' },
    ])
    await firstRequest

    expect(ctx.get(searchResultsAtom)).toHaveLength(1)
    expect(ctx.get(searchResultsAtom)[0].id).toBe(freshSermon.id)
  })

  test('resetSearchResults resets results and the searching flag', async () => {
    const ctx = createCtx()
    searchResultsAtom(ctx, [buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock())])
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

    resolveRequest(buildSermonsResponse([sermonsMocks.getSermonControllerFindOneResponseMock()]))
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

    resolveRequest(buildSermonsResponse([sermonsMocks.getSermonControllerFindOneResponseMock()]))
    await request

    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(mockSetCachedSearchResults).not.toHaveBeenCalled()
  })

  test('openSearch opens the search and closeSearch resets all search state', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, [buildSermonData(sermonsMocks.getSermonControllerFindOneResponseMock())])
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
