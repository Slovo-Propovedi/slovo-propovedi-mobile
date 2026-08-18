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
    result.current.navigateToPlaylistList('section-123', 'My List')

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/listen/playlist-list' }),
    )
  })

  test('navigateToPlaylistList passes sectionId and title', async () => {
    const { result } = await renderHook(() => useListenNavigation())
    result.current.navigateToPlaylistList('section-42', 'My List')

    const calledWith = mockPush.mock.calls[0][0]
    expect(calledWith.params.sectionId).toBe('section-42')
    expect(calledWith.params.title).toBe('My List')
  })
})
