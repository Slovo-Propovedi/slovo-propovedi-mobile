import { sectionsMocks } from 'shared/api/generated'
import { mapSectionEntityToSectionData, normalizeItemsRows } from './mapSectionEntityToSectionData'

const createSectionEntity = (itemsRows: null | number) =>
  sectionsMocks.getSectionControllerFindOneResponseMock({ itemsRows })

describe('mapSectionEntityToSectionData', () => {
  describe('itemsRows normalization', () => {
    test('clamps zero to a single row', () => {
      expect(mapSectionEntityToSectionData(createSectionEntity(0)).itemsRows).toBe(1)
    })

    test('clamps negative values to a single row', () => {
      expect(mapSectionEntityToSectionData(createSectionEntity(-4)).itemsRows).toBe(1)
    })

    test('floors fractional values', () => {
      expect(mapSectionEntityToSectionData(createSectionEntity(2.7)).itemsRows).toBe(2)
    })

    test('maps null to undefined so the Slider default of 1 applies', () => {
      expect(mapSectionEntityToSectionData(createSectionEntity(null)).itemsRows).toBeUndefined()
    })

    test('keeps an absent itemsRows as undefined', () => {
      expect(normalizeItemsRows(undefined)).toBeUndefined()
    })
  })
})
