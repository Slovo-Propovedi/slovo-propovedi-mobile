import { renderHook } from '@testing-library/react-native'
import { type PlaylistData } from '../model/domain/common'
import { useListenNavigation } from './useListenNavigation'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/artwork.jpg',
  id: '1',
  sermons: [],
  title: 'Test Playlist',
}

describe('useListenNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('navigateToPlaylist calls router.push with correct pathname', async () => {
    const { result } = await renderHook(() => useListenNavigation())
    result.current.navigateToPlaylist(mockPlaylist)

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/listen/playlist' }))
  })

  test('navigateToPlaylist serializes playlist to JSON in params', async () => {
    const { result } = await renderHook(() => useListenNavigation())
    result.current.navigateToPlaylist(mockPlaylist)

    const calledWith = mockPush.mock.calls[0][0]
    expect(calledWith.params.playlist).toBe(JSON.stringify(mockPlaylist))
  })

  test('navigateToPlaylistList calls router.push with correct pathname', async () => {
    const { result } = await renderHook(() => useListenNavigation())
    result.current.navigateToPlaylistList([mockPlaylist], 'My List')

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/listen/playlist-list' }),
    )
  })

  test('navigateToPlaylistList serializes playlists array and passes title', async () => {
    const { result } = await renderHook(() => useListenNavigation())
    const playlists = [mockPlaylist]
    result.current.navigateToPlaylistList(playlists, 'My List')

    const calledWith = mockPush.mock.calls[0][0]
    expect(calledWith.params.playlists).toBe(JSON.stringify(playlists))
    expect(calledWith.params.title).toBe('My List')
  })
})
