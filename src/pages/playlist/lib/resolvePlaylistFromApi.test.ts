import { resolvePlaylistFromApi } from './resolvePlaylistFromApi'

const mockGetPlaylists = jest.fn()
const mockFindOne = jest.fn()
const mockMapPlaylistEntityToPlaylistData = jest.fn()

jest.mock('shared/api', () => ({
  mapPlaylistEntityToPlaylistData: (...args: unknown[]) =>
    mockMapPlaylistEntityToPlaylistData(...args),
  playlistsApi: {
    getPlaylists: (...args: unknown[]) => mockGetPlaylists(...args),
  },
}))

const ENTITY = {
  artwork: '',
  description: 'Описание',
  id: 'pl-1',
  sections: [],
  sermons: [],
  title: 'Плейлист',
}

const PLAYLIST = {
  artwork: null,
  description: 'Описание',
  id: 'pl-1',
  sermons: [],
  title: 'Плейлист',
}

describe('resolvePlaylistFromApi', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPlaylists.mockReturnValue({ playlistControllerFindOne: mockFindOne })
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('returns the mapped playlist on success', async () => {
    mockFindOne.mockResolvedValue(ENTITY)
    mockMapPlaylistEntityToPlaylistData.mockReturnValue(PLAYLIST)

    const result = await resolvePlaylistFromApi('pl-1')

    expect(result).toBe(PLAYLIST)
    expect(mockFindOne).toHaveBeenCalledWith('pl-1')
    expect(mockMapPlaylistEntityToPlaylistData).toHaveBeenCalledWith(ENTITY)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  test('returns undefined when the request fails without rethrowing', async () => {
    mockFindOne.mockRejectedValue(new Error('network down'))

    const result = await resolvePlaylistFromApi('pl-1')

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'resolvePlaylistFromApi failed:',
      expect.any(Error),
    )
  })
})
