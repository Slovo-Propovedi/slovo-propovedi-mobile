import AsyncStorage from '@react-native-async-storage/async-storage'
import z from 'zod'
import { getCachedJson } from './getCachedJson'

const stringArraySchema = z.array(z.string())

describe('getCachedJson', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('reads the value under the given key', async () => {
    const spy = jest
      .spyOn(AsyncStorage, 'getItem')
      .mockResolvedValueOnce(JSON.stringify(['a', 'b']))

    await getCachedJson('some:key', stringArraySchema)

    expect(spy).toHaveBeenCalledWith('some:key')
  })

  test('returns undefined when nothing is stored', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(null)

    const result = await getCachedJson('some:key', stringArraySchema)

    expect(result).toBeUndefined()
  })

  test('returns undefined when the stored value is invalid JSON', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce('{not valid json}')

    const result = await getCachedJson('some:key', stringArraySchema)

    expect(result).toBeUndefined()
  })

  test('returns undefined when the stored value does not match the schema', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(JSON.stringify([{ foo: 'bar' }]))

    const result = await getCachedJson('some:key', stringArraySchema)

    expect(result).toBeUndefined()
  })

  test('returns parsed data for a valid stored value', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(JSON.stringify(['a', 'b']))

    const result = await getCachedJson('some:key', stringArraySchema)

    expect(result).toEqual(['a', 'b'])
  })
})
