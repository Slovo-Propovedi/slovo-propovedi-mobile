import { act, waitFor } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderHookWithProviders, renderWithProviders } from 'shared/mocks'
import { useSermonFormController } from '../lib/useSermonFormController'
import { AdminSermonCreateScreen } from './AdminSermonCreateScreen'

const mockCreate = jest.fn()
const mockFindAll = jest.fn()
const mockDistinct = jest.fn()
const mockGetFiles = jest.fn()
const mockPlaylistFindAll = jest.fn()

jest.mock('shared/api', () => ({
  filesApi: { getFiles: () => ({ getFiles: mockGetFiles }) },
  playlistsApi: {
    getPlaylists: () => ({ playlistControllerFindAll: mockPlaylistFindAll }),
  },
  sermonsApi: {
    getSermons: () => ({
      sermonControllerCreate: mockCreate,
      sermonControllerFindAll: mockFindAll,
      sermonControllerGetDistinctValues: mockDistinct,
    }),
  },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

const renderController = () =>
  renderHookWithProviders(() => useSermonFormController({ mode: 'create' }))

describe('<AdminSermonCreateScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })
    mockDistinct.mockResolvedValue({ artists: [], books: [] })
    mockGetFiles.mockResolvedValue({ count: 0, files: [] })
    mockPlaylistFindAll.mockResolvedValue({ count: 0, nextCursor: null, playlists: [] })
    mockCreate.mockResolvedValue(sermonsMocks.getSermonControllerFindOneResponseMock())
  })

  test('renders the main, scripture, media and playlist blocks', async () => {
    const { findByText, getByLabelText } = await renderWithProviders(<AdminSermonCreateScreen />)

    expect(await findByText('Писание')).toBeTruthy()
    expect(await findByText('Медиа')).toBeTruthy()
    expect(await findByText('Плейлисты')).toBeTruthy()
    expect(getByLabelText('Название')).toBeTruthy()
    expect(getByLabelText('Проповедник')).toBeTruthy()
  })

  test('submits cleared optional fields as null', async () => {
    const { result } = await renderController()
    expect(result.current).not.toBeNull()

    await act(async () => {
      result.current.onChange('title', 'Сила веры')
      result.current.onChange('artist', 'Иоанн')
    })
    expect(result.current.values.title).toBe('Сила веры')
    expect(result.current.values.artist).toBe('Иоанн')

    await act(async () => {
      await result.current.save()
    })

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      artist: 'Иоанн',
      audioUrl: null,
      book: null,
      chapter: null,
      description: null,
      playlistsIds: [],
      textFileUrl: null,
      title: 'Сила веры',
      verse: null,
      youtubeUrl: null,
    })
  })

  test('does not submit while the title is empty', async () => {
    const { result } = await renderController()
    expect(result.current).not.toBeNull()

    await act(async () => {
      await result.current.save()
    })

    expect(mockCreate).not.toHaveBeenCalled()
    expect(result.current.error).toBeTruthy()
  })
})
