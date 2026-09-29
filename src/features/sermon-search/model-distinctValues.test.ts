const mockSermonControllerGetDistinctValues = jest.fn()
const mockGetCachedDistinctValues = jest.fn()
const mockSetCachedDistinctValues = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: {
    getSermons: () => ({
      sermonControllerGetDistinctValues: mockSermonControllerGetDistinctValues,
    }),
  },
}))

jest.mock('./lib/distinctValuesCache', () => ({
  getCachedDistinctValues: (...args: unknown[]) => mockGetCachedDistinctValues(...args),
  setCachedDistinctValues: (...args: unknown[]) => mockSetCachedDistinctValues(...args),
}))

import { createCtx } from '@reatom/framework'
import { sermonsMocks } from 'shared/api/generated'
import { distinctValuesAtom, fetchDistinctValues } from './model-distinctValues'

describe('sermon-search distinct values model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetCachedDistinctValues.mockResolvedValue(undefined)
    mockSetCachedDistinctValues.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('fetchDistinctValues loads values and writes the cache', async () => {
    const values = sermonsMocks.getSermonControllerGetDistinctValuesResponseMock()
    mockSermonControllerGetDistinctValues.mockResolvedValue(values)
    const ctx = createCtx()

    await fetchDistinctValues(ctx)

    expect(mockSetCachedDistinctValues).toHaveBeenCalledWith(values)
    expect(ctx.get(distinctValuesAtom)).toEqual(values)
  })

  test('fetchDistinctValues falls back to the cache on network error', async () => {
    const cachedValues = sermonsMocks.getSermonControllerGetDistinctValuesResponseMock()
    mockSermonControllerGetDistinctValues.mockRejectedValue(new Error('network down'))
    mockGetCachedDistinctValues.mockResolvedValue(cachedValues)
    const ctx = createCtx()

    await fetchDistinctValues(ctx)

    expect(ctx.get(distinctValuesAtom)).toEqual(cachedValues)
  })

  test('fetchDistinctValues keeps the atom empty on network error without cache', async () => {
    mockSermonControllerGetDistinctValues.mockRejectedValue(new Error('network down'))
    const ctx = createCtx()

    await fetchDistinctValues(ctx)

    expect(ctx.get(distinctValuesAtom)).toBeNull()
  })

  test('fetchDistinctValues does not refetch when values are already loaded', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, sermonsMocks.getSermonControllerGetDistinctValuesResponseMock())

    await fetchDistinctValues(ctx)

    expect(mockSermonControllerGetDistinctValues).not.toHaveBeenCalled()
  })

  test('fetchDistinctValues deduplicates concurrent calls', async () => {
    const values = sermonsMocks.getSermonControllerGetDistinctValuesResponseMock()
    let resolveRequest!: (value: unknown) => void
    mockSermonControllerGetDistinctValues.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve
        }),
    )
    const ctx = createCtx()

    const first = fetchDistinctValues(ctx)
    const second = fetchDistinctValues(ctx)
    await Promise.resolve()

    resolveRequest(values)
    await Promise.all([first, second])

    expect(mockSermonControllerGetDistinctValues).toHaveBeenCalledTimes(1)
    expect(ctx.get(distinctValuesAtom)).toEqual(values)
  })
})
