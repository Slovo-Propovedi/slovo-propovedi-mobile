import { playlistsMocks } from 'shared/api/generated'
import {
  buildCreatePlaylistDto,
  buildUpdatePlaylistDto,
  initialFormValues,
  type PlaylistFormValues,
} from './playlistFormState'

const BASE_VALUES: PlaylistFormValues = {
  artwork: '  https://cdn.example/cover.jpg  ',
  description: '',
  selectedSectionIds: [],
  selectedSermonIds: [],
  title: '  Воскресные проповеди  ',
}

describe('playlistFormState', () => {
  describe('initialFormValues', () => {
    test('derives relation ids from the initial entity', () => {
      const initial = playlistsMocks.getPlaylistControllerFindOneResponseMock({
        description: 'Описание',
        title: 'Плейлист',
      })
      initial.sections = [
        {
          description: null,
          id: 's1',
          itemsRows: null,
          itemsSize: 'middle',
          playlists: [],
          position: 0,
          title: 'Раздел',
          transform: 'high',
        },
      ]
      initial.sermons = [initial.sermons[0]]

      const values = initialFormValues(initial)

      expect(values.title).toEqual('Плейлист')
      expect(values.description).toEqual('Описание')
      expect(values.selectedSectionIds).toEqual(['s1'])
      expect(values.selectedSermonIds).toEqual([initial.sermons[0].id])
    })

    test('falls back to defaults when there is no entity', () => {
      const values = initialFormValues(null)

      expect(values).toEqual({
        artwork: '',
        description: '',
        selectedSectionIds: [],
        selectedSermonIds: [],
        title: '',
      })
    })
  })

  describe('buildCreatePlaylistDto', () => {
    test('trims the title, trims artwork and sends a cleared description as null', () => {
      const dto = buildCreatePlaylistDto(BASE_VALUES)

      expect(dto.title).toEqual('Воскресные проповеди')
      expect(dto.artwork).toEqual('https://cdn.example/cover.jpg')
      expect(dto.description).toBeNull()
    })
  })

  describe('buildUpdatePlaylistDto', () => {
    test('always sends the relation arrays (empty arrays clear them)', () => {
      const dto = buildUpdatePlaylistDto(BASE_VALUES)

      expect(dto.sermonsIds).toEqual([])
      expect(dto.sectionsIds).toEqual([])
    })

    test('sends the selected sermon and section ids', () => {
      const dto = buildUpdatePlaylistDto({
        ...BASE_VALUES,
        selectedSectionIds: ['s2', 's1'],
        selectedSermonIds: ['m2', 'm1'],
      })

      expect(dto.sermonsIds).toEqual(['m2', 'm1'])
      expect(dto.sectionsIds).toEqual(['s2', 's1'])
    })
  })
})
