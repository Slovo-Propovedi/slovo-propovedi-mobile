import { fireEvent } from '@testing-library/react-native'
import { type APITypes } from 'shared/api'
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

const FORM_SCROLL_TEST_ID = 'form-scroll-view'
const SCROLL_NEAR_END = {
  contentOffset: { x: 0, y: 900 },
  contentSize: { height: 1000, width: 400 },
  layoutMeasurement: { height: 200, width: 400 },
}

const buildSermon = (title: string, id: string) =>
  sermonsMocks.getSermonControllerFindOneResponseMock({ id, title })

// A PlaylistSermon is only produced nested inside the playlist factory, so build
// one from a factory sample and override the fields the test cares about.
const buildPlaylistSermon = (title: string, id: string): APITypes.PlaylistSermon => {
  const [sample] = playlistsMocks.getPlaylistControllerFindOneResponseMock().sermons

  return { ...sample, id, title }
}

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
    initial.sermons = [buildPlaylistSermon(selected.title, selected.id)]
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
      playlistsMocks.getPlaylistControllerFindOneResponseMock({ sermons: [], title: 'Плейлист' }),
    )

    const { findByText, getByTestId } = await renderWithProviders(<AdminPlaylistEditScreen />)
    await findByText(first.title)

    // The picker list does not scroll itself: pagination is triggered by the
    // outer form scroll approaching its end.
    fireEvent.scroll(getByTestId(FORM_SCROLL_TEST_ID), { nativeEvent: SCROLL_NEAR_END })

    expect(await findByText(second.title)).toBeTruthy()
    expect(mockSermonFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'cursor-2', take: 20 }),
    )
  })
})
