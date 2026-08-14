import AsyncStorage from '@react-native-async-storage/async-storage'
import { setCachedJson } from './setCachedJson'

describe('setCachedJson', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('calls setItem with the key and the JSON-serialized value', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    await setCachedJson('some:key', { a: 1 })

    expect(spy).toHaveBeenCalledWith('some:key', '{"a":1}')
  })

  test('serializes arrays to a JSON string', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    await setCachedJson('some:key', ['x', 'y'])

    expect(spy).toHaveBeenCalledWith('some:key', '["x","y"]')
  })

  test('returns void', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    const result = await setCachedJson('some:key', null)

    expect(result).toBeUndefined()
  })
})
