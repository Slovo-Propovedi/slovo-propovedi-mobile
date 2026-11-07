import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import z from 'zod'
import { clearSessionCache } from './clearSessionCache'
import { createSessionCache } from './createSessionCache'

const flushWrites = () => new Promise(resolve => setTimeout(resolve, 0))

const makeCache = (options: { maxEntries?: number; sensitive?: boolean } = {}) =>
  createSessionCache({
    maxEntries: options.maxEntries ?? 2,
    name: 'testCache',
    schema: z.object({ title: z.string() }),
    sensitive: options.sensitive,
  })

describe('createSessionCache', () => {
  test('stores the fetched value and reads it back', async () => {
    const cache = makeCache()

    const value = await cache.fetchThrough('a', async () => ({ title: 'A' }))
    await flushWrites()

    expect(value).toEqual({ title: 'A' })
    await expect(cache.read('a')).resolves.toEqual({ title: 'A' })
  })

  test('keeps only the most recent maxEntries keys', async () => {
    const cache = makeCache({ maxEntries: 2 })

    await cache.fetchThrough('a', async () => ({ title: 'A' }))
    await cache.fetchThrough('b', async () => ({ title: 'B' }))
    await cache.fetchThrough('c', async () => ({ title: 'C' }))
    await flushWrites()

    await expect(cache.read('a')).resolves.toBeUndefined()
    await expect(cache.read('c')).resolves.toEqual({ title: 'C' })
  })

  test('ignores a stored value that does not match the schema', async () => {
    await AsyncStorage.setItem(
      'sessionCache:testCache',
      JSON.stringify({ entries: [{ key: 'a', value: { title: 1 } }] }),
    )

    await expect(makeCache().read('a')).resolves.toBeUndefined()
  })

  test('drops a write whose request started before a clear', async () => {
    const cache = makeCache()
    let resolveFetch: (value: { title: string }) => void = () => {}
    const pending = cache.fetchThrough('a', () => new Promise(resolve => (resolveFetch = resolve)))

    await clearSessionCache()
    resolveFetch({ title: 'stale session' })
    await pending
    await flushWrites()

    await expect(cache.read('a')).resolves.toBeUndefined()
  })

  test('keeps public records out of SecureStore and sensitive ones out of AsyncStorage', async () => {
    await makeCache().fetchThrough('a', async () => ({ title: 'public' }))
    await createSessionCache({
      maxEntries: 1,
      name: 'secretCache',
      schema: z.object({ title: z.string() }),
      sensitive: true,
    }).fetchThrough('a', async () => ({ title: 'secret' }))
    await flushWrites()

    expect(await AsyncStorage.getItem('sessionCache:testCache')).toContain('public')
    expect(await AsyncStorage.getItem('sessionCache:secretCache')).toBeNull()
    expect(await SecureStore.getItemAsync('sessionCache.secretCache')).toContain('secret')
  })

  test('clearSessionCache wipes public and sensitive records', async () => {
    const sensitive = makeCache({ sensitive: true })
    const plain = createSessionCache({
      maxEntries: 1,
      name: 'otherCache',
      schema: z.object({ title: z.string() }),
    })
    await sensitive.fetchThrough('a', async () => ({ title: 'A' }))
    await plain.fetchThrough('a', async () => ({ title: 'B' }))
    await flushWrites()

    await clearSessionCache()

    await expect(sensitive.read('a')).resolves.toBeUndefined()
    await expect(plain.read('a')).resolves.toBeUndefined()
  })
})
