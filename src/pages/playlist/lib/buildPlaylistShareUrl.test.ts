import { ENV } from 'shared/config'
import { buildPlaylistShareUrl } from './buildPlaylistShareUrl'

describe('buildPlaylistShareUrl', () => {
  test('builds the App Links playlist URL with the id in the query', () => {
    const result = buildPlaylistShareUrl('pl-1')

    expect(result).toBe(`https://${ENV.webHostname}/listen/playlist?playlist=pl-1`)
  })

  test('URL-encodes the playlist id', () => {
    const result = buildPlaylistShareUrl('a b/c')

    expect(result).toBe(`https://${ENV.webHostname}/listen/playlist?playlist=a%20b%2Fc`)
  })
})
