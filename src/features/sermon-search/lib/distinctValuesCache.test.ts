import AsyncStorage from '@react-native-async-storage/async-storage'
import { CACHED_DISTINCT_VALUES } from 'shared/config'
import { getCachedDistinctValues, setCachedDistinctValues } from './distinctValuesCache'

describe('distinctValuesCache', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('returns undefined when nothing is cached', async () => {
    const result = await getCachedDistinctValues()

    expect(result).toBeUndefined()
  })

  test('writes values under the cache key', async () => {
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem')

    await setCachedDistinctValues({ artists: ['Иван'], books: ['Матфея'] })

    expect(setItemSpy).toHaveBeenCalledWith(
      CACHED_DISTINCT_VALUES,
      JSON.stringify({ artists: ['Иван'], books: ['Матфея'] }),
    )
  })

  test('returns cached values', async () => {
    await setCachedDistinctValues({ artists: ['Иван'], books: ['Матфея'] })

    const result = await getCachedDistinctValues()

    expect(result).toEqual({ artists: ['Иван'], books: ['Матфея'] })
  })

  test('returns undefined for invalid cached data', async () => {
    await AsyncStorage.setItem(CACHED_DISTINCT_VALUES, JSON.stringify({ artists: 'not-array' }))

    const result = await getCachedDistinctValues()

    expect(result).toBeUndefined()
  })
})
