import { sectionsMocks } from 'shared/api/generated'
import {
  buildCreateSectionDto,
  buildUpdateSectionDto,
  initialFormValues,
  type SectionFormValues,
} from './sectionFormState'

const BASE_VALUES: SectionFormValues = {
  borderRadius: false,
  description: '',
  isDescriptionTitleOnSlideLarge: false,
  itemsRows: '',
  itemsSize: 'middle',
  selectedPlaylistIds: [],
  title: '  Последние проповеди  ',
  transform: 'high',
  whereIsSlideTitleLocated: 'on',
}

describe('sectionFormState', () => {
  describe('initialFormValues', () => {
    test('derives playlist ids from the initial entity', () => {
      const values = initialFormValues({
        borderRadius: true,
        description: 'Описание',
        id: 'section-1',
        isDescriptionTitleOnSlideLarge: true,
        itemsRows: 2,
        itemsSize: 'large',
        playlists: [
          {
            artwork: '',
            description: '',
            id: 'p1',
            position: 0,
            sections: [],
            sermons: [],
            title: 'A',
          },
          {
            artwork: '',
            description: '',
            id: 'p2',
            position: 1,
            sections: [],
            sermons: [],
            title: 'B',
          },
        ],
        position: 0,
        title: 'Раздел',
        transform: 'short',
        whereIsSlideTitleLocated: 'under',
      })

      expect(values.selectedPlaylistIds).toEqual(['p1', 'p2'])
      expect(values.itemsRows).toEqual('2')
      expect(values.itemsSize).toEqual('large')
    })

    test('normalizes the legacy bothOnAndUnder title location to under', () => {
      const section = sectionsMocks.getSectionControllerFindOneResponseMock({
        whereIsSlideTitleLocated: 'bothOnAndUnder',
      })

      expect(initialFormValues(section).whereIsSlideTitleLocated).toEqual('under')
    })

    test('falls back to defaults when there is no entity', () => {
      const values = initialFormValues(null)

      expect(values.selectedPlaylistIds).toEqual([])
      expect(values.title).toEqual('')
      expect(values.itemsSize).toEqual('middle')
      expect(values.transform).toEqual('high')
      expect(values.borderRadius).toBe(true)
      expect(values.isDescriptionTitleOnSlideLarge).toBe(false)
    })
  })

  describe('buildCreateSectionDto', () => {
    test('trims the title and sends a cleared description as null', () => {
      const dto = buildCreateSectionDto(BASE_VALUES)

      expect(dto.title).toEqual('Последние проповеди')
      expect(dto.description).toBeNull()
    })

    test('parses a numeric itemsRows and leaves an empty one as null', () => {
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '3' }).itemsRows).toEqual(3)
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '' }).itemsRows).toBeNull()
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: 'abc' }).itemsRows).toBeNull()
    })

    test('accepts only positive integers for itemsRows', () => {
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '2.5' }).itemsRows).toBeNull()
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '1e3' }).itemsRows).toBeNull()
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '-4' }).itemsRows).toBeNull()
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '0' }).itemsRows).toBeNull()
      expect(buildCreateSectionDto({ ...BASE_VALUES, itemsRows: '4' }).itemsRows).toEqual(4)
    })
  })

  describe('buildUpdateSectionDto', () => {
    test('always sends the playlistsIds relation array', () => {
      const dto = buildUpdateSectionDto({ ...BASE_VALUES, selectedPlaylistIds: ['p2', 'p1'] })

      expect(dto.playlistsIds).toEqual(['p2', 'p1'])
    })

    test('sends an empty playlistsIds when the relation is cleared', () => {
      expect(buildUpdateSectionDto(BASE_VALUES).playlistsIds).toEqual([])
    })
  })
})
