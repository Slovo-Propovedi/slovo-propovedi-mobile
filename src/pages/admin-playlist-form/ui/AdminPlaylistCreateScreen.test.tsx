import { renderWithProviders } from 'shared/mocks'
import { AdminPlaylistCreateScreen } from './AdminPlaylistCreateScreen'

const mockFindAll = jest.fn()
const mockSectionFindAll = jest.fn()
const mockGetFiles = jest.fn()

jest.mock('shared/api', () => ({
  filesApi: { getFiles: () => ({ getFiles: mockGetFiles }) },
  playlistsApi: {
    getPlaylists: () => ({
      playlistControllerCreate: jest.fn(),
      playlistControllerFindAll: mockFindAll,
    }),
  },
  sectionsApi: { getSections: () => ({ sectionControllerFindAll: mockSectionFindAll }) },
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockFindAll }) },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

describe('<AdminPlaylistCreateScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindAll.mockResolvedValue({
      count: 0,
      nextCursor: null,
      playlists: [],
      sermons: [],
    })
    mockSectionFindAll.mockResolvedValue({ count: 0, sections: [] })
    mockGetFiles.mockResolvedValue({ count: 0, files: [] })
  })

  test('renders the form fields and picker blocks', async () => {
    const { findByText, getByLabelText } = await renderWithProviders(<AdminPlaylistCreateScreen />)

    expect(await findByText('Проповеди')).toBeTruthy()
    expect(await findByText('Разделы')).toBeTruthy()
    expect(getByLabelText('Название')).toBeTruthy()
    expect(getByLabelText('Описание')).toBeTruthy()
  })
})
