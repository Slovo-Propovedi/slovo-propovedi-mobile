import { fireEvent } from '@testing-library/react-native'
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

const toPlaylistSermon = (
  sermon: ReturnType<typeof sermonsMocks.getSermonControllerFindOneResponseMock>,
) => ({
  artist: sermon.artist,
  artwork: sermon.artwork,
  audioUrl: sermon.audioUrl,
  book: sermon.book,
  chapter: sermon.chapter,
  description: sermon.description,
  id: sermon.id,
  playlists: [],
  position: 0,
  textFileUrl: sermon.textFileUrl,
  title: sermon.title,
  verse: sermon.verse,
  youtubeUrl: sermon.youtubeUrl,
})

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
    // The fetched page does not contain the included sermon at all; the picker
    // must pin it on top and show it checked anyway.
    mockSermonFindAll.mockResolvedValue({ count: 1, nextCursor: null, sermons: [other] })

    const initial = playlistsMocks.getPlaylistControllerFindOneResponseMock({ title: 'Плейлист' })
    initial.sermons = [toPlaylistSermon(selected)]
    mockFindOne.mockResolvedValue(initial)

    const { findByText, getAllByRole, getAllByText } = await renderWithProviders(
      <AdminPlaylistEditScreen />,
    )

    await findByText('Выбранная')
    // The included-but-unfetched sermon is the first row and is checked.
    expect(getAllByRole('checkbox')[0]).toBeChecked()
    const titles = getAllByText(/Выбранная|Обычная/)
    expect(titles[0].children[0]).toEqual('Выбранная')
  })

  test('appends the next page when the end of the picker list is reached', async () => {
    const first = buildSermon('Первая', 'sermon-1')
    const second = buildSermon('Вторая', 'sermon-2')
    mockSermonFindAll
      .mockResolvedValueOnce({ count: 2, nextCursor: 'cursor-2', sermons: [first] })
      .mockResolvedValueOnce({ count: 2, nextCursor: null, sermons: [second] })

    mockFindOne.mockResolvedValue(
      playlistsMocks.getPlaylistControllerFindOneResponseMock({ title: 'Плейлист' }),
    )

    const { findByText, getByTestId } = await renderWithProviders(<AdminPlaylistEditScreen />)
    await findByText('Первая')

    fireEvent(getByTestId('sermon-picker-list'), 'onEndReached')

    expect(await findByText('Вторая')).toBeTruthy()
    expect(mockSermonFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'cursor-2', take: 20 }),
    )
  })
})
