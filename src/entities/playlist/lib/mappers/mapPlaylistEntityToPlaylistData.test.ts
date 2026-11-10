import { playlistsMocks } from 'shared/api/generated'
import { mapPlaylistEntityToPlaylistData } from './mapPlaylistEntityToPlaylistData'

const BLURHASH = 'LKO2?wKcjK'

describe('mapPlaylistEntityToPlaylistData', () => {
  test('normalizes empty-string artwork to null', () => {
    const entity = playlistsMocks.getPlaylistControllerCreateResponseMock({ artwork: '' })

    expect(mapPlaylistEntityToPlaylistData(entity).artwork).toBeNull()
  })

  test('keeps a non-empty artwork url', () => {
    const artwork = 'https://example.org/playlist.jpg'
    const entity = playlistsMocks.getPlaylistControllerCreateResponseMock({ artwork })

    expect(mapPlaylistEntityToPlaylistData(entity).artwork).toBe(artwork)
  })

  test('projects playlist artworkBlurhash', () => {
    const entity = playlistsMocks.getPlaylistControllerCreateResponseMock({
      artworkBlurhash: BLURHASH,
    })

    expect(mapPlaylistEntityToPlaylistData(entity).artworkBlurhash).toBe(BLURHASH)
  })

  test('projects nested sermon artworkBlurhash', () => {
    const entity = playlistsMocks.getPlaylistControllerCreateResponseMock()
    const firstSermon = entity.sermons[0]
    if (!firstSermon) throw new Error('faker must return at least one sermon')
    Object.assign(firstSermon, { artworkBlurhash: BLURHASH })

    expect(mapPlaylistEntityToPlaylistData(entity).sermons[0]?.artworkBlurhash).toBe(BLURHASH)
  })
})
