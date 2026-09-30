import { playlistsMocks, sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminPlaylistEditScreen } from './AdminPlaylistEditScreen'

const mockFindOne = jest.fn()
const mockSermonFindAll = jest.fn()
const mockSectionFindAll = jest.fn()
const mockGetFiles = jest.fn()

jest.mock('shared/api', () => ({
  filesApi: { getFiles: () => ({ getFiles: mockGetFiles }) },
  playlistsApi: {
    getPlaylists: () => ({
      playlistControllerFindOne: mockFindOne,
      playlistControllerUpdate: jest.fn(),
    }),
  },
  sectionsApi: { getSections: () => ({ sectionControllerFindAll: mockSectionFindAll }) },
  sermonsApi: { getSermons: () => ({ sermonControllerFindAll: mockSermonFindAll }) },
}))

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: 'p1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

const buildSermon = (title: string, id: string) =>
  sermonsMocks.getSermonControllerFindOneResponseMock({ id, title })

describe('<AdminPlaylistEditScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSectionFindAll.mockResolvedValue({ count: 0, sections: [] })
    mockGetFiles.mockResolvedValue({ count: 0, files: [] })
  })

  test('renders the loaded entity title in the form', async () => {
    const initial = playlistsMocks.getPlaylistControllerFindOneResponseMock({
      description: 'Описание',
      title: 'Плейлист',
    })
    mockFindOne.mockResolvedValue(initial)
    mockSermonFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByDisplayValue } = await renderWithProviders(<AdminPlaylistEditScreen />)

    expect(await findByDisplayValue('Плейлист')).toBeTruthy()
  })

  test('renders already selected sermons before the rest', async () => {
    const selected = buildSermon('Выбранная', 'sermon-selected')
    const other = buildSermon('Обычная', 'sermon-other')
    // Server search returns the unselected sermon first; the picker must pin the
    // selected one on top.
    mockSermonFindAll.mockResolvedValue({ count: 2, nextCursor: null, sermons: [other, selected] })

    const initial = playlistsMocks.getPlaylistControllerFindOneResponseMock({ title: 'Плейлист' })
    initial.sermons = [
      {
        artist: selected.artist,
        artwork: selected.artwork,
        audioUrl: selected.audioUrl,
        book: selected.book,
        chapter: selected.chapter,
        description: selected.description,
        id: selected.id,
        playlists: [],
        position: 0,
        textFileUrl: selected.textFileUrl,
        title: selected.title,
        verse: selected.verse,
        youtubeUrl: selected.youtubeUrl,
      },
    ]
    mockFindOne.mockResolvedValue(initial)

    const { findByText, getAllByText } = await renderWithProviders(<AdminPlaylistEditScreen />)

    await findByText('Выбранная')
    const titles = getAllByText(/Выбранная|Обычная/)
    expect(titles[0].children[0]).toEqual('Выбранная')
  })
})
