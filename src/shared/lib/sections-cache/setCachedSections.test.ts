import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SectionData } from '../../model/domain/common'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { setCachedSections } from './setCachedSections'

const validSection: SectionData = { itemsSize: 'large', transform: 'middle' }

describe('setCachedSections', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('calls AsyncStorage.setItem with CACHED_SECTIONS key', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    await setCachedSections([validSection])

    expect(spy).toHaveBeenCalledWith(CACHED_SECTIONS, expect.any(String))
  })

  test('serializes sections to JSON string', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    await setCachedSections([validSection])

    expect(spy).toHaveBeenCalledWith(CACHED_SECTIONS, JSON.stringify([validSection]))
  })

  test('returns void (resolves with undefined)', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    const result = await setCachedSections([validSection])

    expect(result).toBeUndefined()
  })

  test('passes the stringified array to setItem', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()
    const sections: SectionData[] = [validSection, { itemsSize: 'on', transform: 'short' }]

    await setCachedSections(sections)

    expect(spy).toHaveBeenCalledWith(CACHED_SECTIONS, JSON.stringify(sections))
  })

  test('works with an empty array', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValueOnce()

    await setCachedSections([])

    expect(spy).toHaveBeenCalledWith(CACHED_SECTIONS, '[]')
  })
})
