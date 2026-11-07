import { createMirroredStorage, type StorageBackend } from './createMirroredStorage'

const createMemoryBackend = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial))
  const backend: StorageBackend = {
    clear: jest.fn(async () => data.clear()),
    loadAll: jest.fn(async () => new Map(data)),
    put: jest.fn(async entries => entries.forEach(([key, value]) => data.set(key, value))),
    remove: jest.fn(async keys => keys.forEach(key => data.delete(key))),
  }
  return { backend, data }
}

describe('createMirroredStorage', () => {
  test('loads the backend once and serves reads from memory', async () => {
    const { backend } = createMemoryBackend({ a: '1', b: '2' })
    const storage = createMirroredStorage(async () => backend)

    await expect(storage.getItem('a')).resolves.toBe('1')
    await expect(storage.multiGet(['b', 'missing'])).resolves.toEqual([
      ['b', '2'],
      ['missing', null],
    ])
    await expect(storage.getAllKeys()).resolves.toEqual(['a', 'b'])
    expect(backend.loadAll).toHaveBeenCalledTimes(1)
  })

  test('persists writes and removals to the backend', async () => {
    const { backend, data } = createMemoryBackend({ old: 'x' })
    const storage = createMirroredStorage(async () => backend)

    await storage.setItem('a', '1')
    await storage.multiSet([['b', '2']])
    await storage.multiRemove(['old'])

    expect(Object.fromEntries(data)).toEqual({ a: '1', b: '2' })
    await expect(storage.getItem('old')).resolves.toBeNull()
  })

  test('clear empties both the mirror and the backend', async () => {
    const { backend, data } = createMemoryBackend({ a: '1' })
    const storage = createMirroredStorage(async () => backend)

    await storage.clear()

    expect(data.size).toBe(0)
    await expect(storage.getAllKeys()).resolves.toEqual([])
  })

  test('switches to the fallback when the primary backend fails', async () => {
    const { backend: fallback } = createMemoryBackend({ a: 'from fallback' })
    const storage = createMirroredStorage(
      () => Promise.reject(new Error('IndexedDB blocked')),
      fallback,
    )

    await expect(storage.getItem('a')).resolves.toBe('from fallback')
  })

  test('rejects mergeItem instead of silently dropping data', async () => {
    const storage = createMirroredStorage(async () => createMemoryBackend().backend)

    await expect(storage.mergeItem('a', '{}')).rejects.toThrow('not supported')
  })
})
