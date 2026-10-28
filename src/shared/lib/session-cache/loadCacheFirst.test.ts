import z from 'zod'
import { createSessionCache } from './createSessionCache'
import { loadCacheFirst } from './loadCacheFirst'

const flushWrites = () => new Promise(resolve => setTimeout(resolve, 0))

const cache = createSessionCache({
  maxEntries: 5,
  name: 'loadCacheFirstTest',
  schema: z.object({ title: z.string() }),
})

const seed = async (title: string) => {
  await cache.fetchThrough('a', async () => ({ title }))
  await flushWrites()
}

const httpError = (status: number) => Object.assign(new Error('HTTP'), { response: { status } })

describe('loadCacheFirst', () => {
  test('shows the cached value first and resolves with the network one', async () => {
    await seed('cached')
    const onCached = jest.fn()
    let resolveFetch: (value: { title: string }) => void = () => {}

    const result = loadCacheFirst({
      cache,
      cacheKey: 'a',
      fetcher: () => new Promise<{ title: string }>(resolve => (resolveFetch = resolve)),
      onCached,
    })
    await flushWrites()
    expect(onCached).toHaveBeenCalledWith({ title: 'cached' })

    resolveFetch({ title: 'fresh' })
    await expect(result).resolves.toEqual({ title: 'fresh' })
  })

  test('falls back to the cached value when the network fails', async () => {
    await seed('cached')

    await expect(
      loadCacheFirst({
        cache,
        cacheKey: 'a',
        fetcher: () => Promise.reject(new Error('Network Error')),
        onCached: jest.fn(),
      }),
    ).resolves.toEqual({ title: 'cached' })
  })

  test('rejects without a cached value', async () => {
    const error = new Error('Network Error')

    await expect(
      loadCacheFirst({
        cache,
        cacheKey: 'missing',
        fetcher: () => Promise.reject(error),
        onCached: jest.fn(),
      }),
    ).rejects.toBe(error)
  })

  test('rejects on 404 and forgets the cached entry', async () => {
    await seed('deleted on server')
    const error = httpError(404)

    await expect(
      loadCacheFirst({
        cache,
        cacheKey: 'a',
        fetcher: () => Promise.reject(error),
        onCached: jest.fn(),
      }),
    ).rejects.toBe(error)
    await flushWrites()

    await expect(cache.read('a')).resolves.toBeUndefined()
  })
})
