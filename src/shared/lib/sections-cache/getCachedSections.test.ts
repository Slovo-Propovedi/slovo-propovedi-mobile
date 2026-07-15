import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SectionData } from '../../model/domain/common'
import { CACHED_SECTIONS } from '../../config/cache-storage-keys'
import { getCachedSections } from './getCachedSections'

const validSection: SectionData = { itemsSize: 'small', transform: 'high' }

describe('getCachedSections', () => {
  describe('calls AsyncStorage with correct key', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('calls getItem with CACHED_SECTIONS key', async () => {
      const spy = jest
        .spyOn(AsyncStorage, 'getItem')
        .mockResolvedValueOnce(JSON.stringify([validSection]))

      await getCachedSections()

      expect(spy).toHaveBeenCalledWith(CACHED_SECTIONS)
    })
  })

  describe('returns undefined for invalid data', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('returns undefined when AsyncStorage has no stored value', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(null)

      const result = await getCachedSections()

      expect(result).toBeUndefined()
    })

    test('returns undefined when stored value is invalid JSON', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce('{not valid json}')

      const result = await getCachedSections()

      expect(result).toBeUndefined()
    })

    test('returns undefined when stored value is valid JSON but does not match schema', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(JSON.stringify([{ foo: 'bar' }]))

      const result = await getCachedSections()

      expect(result).toBeUndefined()
    })
  })

  describe('returns parsed data for valid input', () => {
    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('returns parsed array when stored value is a valid sections array', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce(JSON.stringify([validSection]))

      const result = await getCachedSections()

      expect(result).toEqual([validSection])
    })

    test('returns empty array when stored value is "[]"', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce('[]')

      const result = await getCachedSections()

      expect(result).toEqual([])
    })
  })
})
