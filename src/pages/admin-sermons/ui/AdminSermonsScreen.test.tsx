import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminSermonsScreen } from './AdminSermonsScreen'

// MarqueeText renders the title twice (visible + measurer), so a single-Text
// stub keeps text queries unambiguous in list-row tests.
jest.mock('shared/ui/marquee-text/marquee-text', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: ({ testID, text }: { testID?: string; text: string }) => (
      <Text testID={testID}>{text}</Text>
    ),
  }
})

const mockFindAll = jest.fn()
const mockPush = jest.fn()

jest.mock('shared/api', () => ({
  sermonsApi: {
    getSermons: () => ({ sermonControllerFindAll: mockFindAll }),
  },
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void | void) => {
    const { useEffect } = jest.requireActual('react') as {
      useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
    }
    useEffect(callback, [callback])
  },
  useRouter: () => ({ push: mockPush }),
}))

const PAGE_SIZE = 20
const LIST_TEST_ID = 'admin-sermons-list'
const RETRY_LABEL = 'Повторить загрузку'

// One faker sample is enough per page: generating a fresh DTO per row is slow.
const buildSermons = (count: number, prefix: string) => {
  const sample = sermonsMocks.getSermonControllerFindOneResponseMock()

  return Array.from({ length: count }, (_, index) => ({
    ...sample,
    id: `${prefix}${index}`,
    title: `${prefix} ${index}`,
  }))
}

describe('<AdminSermonsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders sermons with the preacher subtitle and media badges', async () => {
    const sermon = sermonsMocks.getSermonControllerFindAllResponseMock({
      sermons: [
        {
          artist: 'Иоанн',
          artwork: 'cover',
          audioUrl: 'audio.mp3',
          book: 'Иоанна',
          chapter: 3,
          description: 'Описание',
          id: 's1',
          playlists: [],
          textFileUrl: null,
          title: 'Сила веры',
          verse: 16,
          youtubeUrl: null,
        },
      ],
    })
    mockFindAll.mockResolvedValue(sermon)

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    expect(await findByText('Сила веры')).toBeTruthy()
    expect(await findByText('Иоанн · Иоанна 3:16')).toBeTruthy()
    expect(await findByText('аудио')).toBeTruthy()
  })

  test('navigates to the detail screen on row press', async () => {
    mockFindAll.mockResolvedValue(
      sermonsMocks.getSermonControllerFindAllResponseMock({
        sermons: [
          {
            artist: 'Иоанн',
            artwork: 'cover',
            audioUrl: null,
            book: null,
            chapter: null,
            description: 'Описание',
            id: 's1',
            playlists: [],
            textFileUrl: null,
            title: 'Сила веры',
            verse: null,
            youtubeUrl: null,
          },
        ],
      }),
    )

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    fireEvent.press(await findByText('Сила веры'))

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        params: { id: 's1' },
        pathname: '/admin/sermons/[id]',
      }),
    )
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    fireEvent.press(await findByText('Загрузить проповедь'))

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/admin/sermons/create'))
  })

  test('shows the empty state when there are no sermons', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByText } = await renderWithProviders(<AdminSermonsScreen />)

    expect(await findByText('Проповедей пока нет')).toBeTruthy()
  })

  test('shows skeleton rows in the list area while the first page loads', async () => {
    mockFindAll.mockReturnValue(new Promise(() => undefined))

    const { findAllByTestId, findByText } = await renderWithProviders(<AdminSermonsScreen />)

    // Header stays visible; only the list body is a placeholder.
    expect(await findByText('Проповеди')).toBeTruthy()
    expect((await findAllByTestId('admin-skeleton-row')).length).toBeGreaterThan(0)
  })

  test('reloads the list sorted by title when picked from the sort select', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findAllByText, findByText } = await renderWithProviders(<AdminSermonsScreen />)

    fireEvent.press(await findByText('По дате'))
    fireEvent.press((await findAllByText('По названию'))[0])

    await waitFor(() =>
      expect(mockFindAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ order: 'asc', sort: 'title' }),
      ),
    )
  })

  test('reloads the first page when pulled to refresh', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByText, getByTestId } = await renderWithProviders(<AdminSermonsScreen />)
    await findByText('Проповеди')

    const { onRefresh } = getByTestId(LIST_TEST_ID).props.refreshControl.props
    await act(async () => {
      await onRefresh()
    })

    await waitFor(() => expect(mockFindAll).toHaveBeenCalledTimes(2))
  })

  test('shows a retry row after a failed loadMore and clears it on a successful retry', async () => {
    mockFindAll
      .mockResolvedValueOnce({
        count: PAGE_SIZE + 1,
        nextCursor: null,
        sermons: buildSermons(PAGE_SIZE, 'page'),
      })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ count: 1, nextCursor: null, sermons: buildSermons(1, 'fresh') })

    const { findByText, getByTestId, queryByText } = await renderWithProviders(
      <AdminSermonsScreen />,
    )
    await findByText('page 0')

    fireEvent(getByTestId(LIST_TEST_ID), 'onEndReached')

    expect(await findByText(RETRY_LABEL)).toBeTruthy()

    fireEvent.press(await findByText(RETRY_LABEL))

    await waitFor(() => expect(queryByText(RETRY_LABEL)).toBeNull())
    // The appended row is beyond FlatList's initial window, so assert the count
    // (sermons.length) instead of the off-screen title.
    expect(await findByText('Всего: 21')).toBeTruthy()
  })
})
