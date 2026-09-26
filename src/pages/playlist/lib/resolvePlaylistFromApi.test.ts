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

const UUID = '123e4567-e89b-12d3-a456-426614174000'

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

const axios404Error = Object.assign(new Error('Request failed with status code 404'), {
  isAxiosError: true,
  response: { status: 404 },
})

describe('resolvePlaylistFromApi', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPlaylists.mockReturnValue({ playlistControllerFindOne: mockFindOne })
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  test('returns the mapped playlist on success', async () => {
    mockFindOne.mockResolvedValue(ENTITY)
    mockMapPlaylistEntityToPlaylistData.mockReturnValue(PLAYLIST)

    const result = await resolvePlaylistFromApi(UUID)

    expect(result).toBe(PLAYLIST)
    expect(mockFindOne).toHaveBeenCalledWith(UUID)
    expect(mockMapPlaylistEntityToPlaylistData).toHaveBeenCalledWith(ENTITY)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('returns undefined for a non-UUID id without calling the API', async () => {
    const result = await resolvePlaylistFromApi('pl-1')

    expect(result).toBeUndefined()
    expect(mockFindOne).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('returns undefined for a UUID with an invalid variant without calling the API', async () => {
    const result = await resolvePlaylistFromApi('123e4567-e89b-12d3-c456-426614174000')

    expect(result).toBeUndefined()
    expect(mockFindOne).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('accepts the nil UUID and calls the API', async () => {
    const NIL_UUID = '00000000-0000-0000-0000-000000000000'
    mockFindOne.mockResolvedValue(ENTITY)
    mockMapPlaylistEntityToPlaylistData.mockReturnValue(PLAYLIST)

    const result = await resolvePlaylistFromApi(NIL_UUID)

    expect(result).toBe(PLAYLIST)
    expect(mockFindOne).toHaveBeenCalledWith(NIL_UUID)
  })

  test('warns and returns undefined on a 404, without logging an error', async () => {
    mockFindOne.mockRejectedValue(axios404Error)

    const result = await resolvePlaylistFromApi(UUID)

    expect(result).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith('resolvePlaylistFromApi: playlist not found:', UUID)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  test('returns undefined when the request fails without rethrowing', async () => {
    mockFindOne.mockRejectedValue(new Error('network down'))

    const result = await resolvePlaylistFromApi(UUID)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'resolvePlaylistFromApi failed:',
      expect.any(Error),
    )
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  test('returns undefined and logs an error when the response mapper throws', async () => {
    mockFindOne.mockResolvedValue(ENTITY)
    mockMapPlaylistEntityToPlaylistData.mockImplementation(() => {
      throw new Error('unexpected sections shape')
    })

    const result = await resolvePlaylistFromApi(UUID)

    expect(result).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'resolvePlaylistFromApi failed:',
      expect.any(Error),
    )
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})
