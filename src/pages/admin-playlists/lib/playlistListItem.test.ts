import { playlistsMocks } from 'shared/api/generated'
import { playlistListItemSchema, toPlaylistListItem } from './playlistListItem'

const createPlaylist = () => playlistsMocks.getPlaylistControllerFindOneResponseMock()

describe('toPlaylistListItem', () => {
  test('keeps the counters but drops the nested sections and sermons', () => {
    const playlists = [createPlaylist(), createPlaylist()]
    const projected = playlists.map(toPlaylistListItem)

    expect(projected.map(item => [item.sermonsCount, item.sectionsCount])).toEqual(
      playlists.map(playlist => [playlist.sermons.length, playlist.sections.length]),
    )
    expect(projected[0]).not.toHaveProperty('sections')
    expect(projected[0]).not.toHaveProperty('sermons')
    expect(Object.keys(projected[0]).sort()).toEqual([
      'artwork',
      'createdAt',
      'id',
      'sectionsCount',
      'sermonsCount',
      'title',
    ])
  })

  test('produces values accepted by the cache schema', () => {
    const projected = toPlaylistListItem(createPlaylist())

    expect(playlistListItemSchema.parse(projected)).toEqual(projected)
  })

  test('rejects a legacy cached record with no counters', () => {
    const result = playlistListItemSchema.safeParse(createPlaylist())

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(issue => issue.path.join('.'))
      expect(paths).toEqual(expect.arrayContaining(['sectionsCount', 'sermonsCount']))
    }
  })
})
