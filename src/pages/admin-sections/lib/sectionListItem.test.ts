import { sectionsMocks } from 'shared/api/generated'
import { sectionListItemSchema, toSectionListItem } from './sectionListItem'

const createSection = () => sectionsMocks.getSectionControllerFindOneResponseMock()

describe('toSectionListItem', () => {
  test('keeps the playlist count but drops the nested playlists', () => {
    const sections = [createSection(), createSection()]
    const projected = sections.map(toSectionListItem)

    expect(projected.map(item => item.playlistsCount)).toEqual(
      sections.map(section => section.playlists.length),
    )
    expect(projected[0]).not.toHaveProperty('playlists')
    expect(Object.keys(projected[0]).sort()).toEqual([
      'description',
      'id',
      'itemsSize',
      'playlistsCount',
      'title',
      'transform',
    ])
  })

  test('produces values accepted by the cache schema', () => {
    const projected = toSectionListItem(createSection())

    expect(sectionListItemSchema.parse(projected)).toEqual(projected)
  })

  test('rejects a legacy cached record with no playlist count', () => {
    const result = sectionListItemSchema.safeParse(createSection())

    expect(result.success).toBe(false)
    if (!result.success)
      expect(result.error.issues.map(issue => issue.path.join('.'))).toContain('playlistsCount')
  })
})
