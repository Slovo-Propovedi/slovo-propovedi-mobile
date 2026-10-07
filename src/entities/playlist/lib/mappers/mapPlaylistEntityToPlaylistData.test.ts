import { playlistsMocks } from 'shared/api/generated'
import { mapPlaylistEntityToPlaylistData } from './mapPlaylistEntityToPlaylistData'

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
})
