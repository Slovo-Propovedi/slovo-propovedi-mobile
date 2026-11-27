import { act, fireEvent, waitFor, within } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
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
const CREATE_BUTTON_LABEL = 'Загрузить проповедь'
const WIDE_TOP_ACTIONS_TEST_ID = 'wide-top-actions'
const SCROLL_HOST_TYPES = new Set(['RCTScrollView', 'ScrollView'])
const WIDE_DIMENSIONS = { fontScale: 1, height: 800, width: 1024 }
const COMPACT_DIMENSIONS = { fontScale: 1, height: 390, width: 844 }

const mockUseWindowDimensions = jest.fn(() => WIDE_DIMENSIONS)

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}))

const hasScrollAncestor = (element: TestInstance): boolean => {
  let current: null | TestInstance = element.parent

  while (current !== null) {
    if (SCROLL_HOST_TYPES.has(String(current.type))) return true
    current = current.parent
  }

  return false
}

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
    mockUseWindowDimensions.mockReturnValue(WIDE_DIMENSIONS)
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
          createdAt: '2024-01-01T12:00:00',
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
    expect(await findByText('Иоанн · Иоанна 3:16 · 1 января 2024')).toBeTruthy()
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
            createdAt: '2024-01-01T00:00:00Z',
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

    await act(async () => {
      await fireEvent.press(await findByText('Сила веры'))
    })

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        params: { id: 's1' },
        pathname: '/admin/sermons/[id]',
      }),
    )
  })

  test('navigates to the create screen from the header button', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByLabelText } = await renderWithProviders(<AdminSermonsScreen />)

    await act(async () => {
      await fireEvent.press(await findByLabelText(CREATE_BUTTON_LABEL))
    })

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

    const { findAllByText, findByText, unmount } = await renderWithProviders(<AdminSermonsScreen />)

    await act(async () => {
      await fireEvent.press(await findByText('По дате'))
    })
    await act(async () => {
      await fireEvent.press((await findAllByText('По названию'))[0])
    })

    await waitFor(() =>
      expect(mockFindAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ order: 'asc', sort: 'title' }),
      ),
    )

    unmount()
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

    const { findByText, getByTestId, queryByText, unmount } = await renderWithProviders(
      <AdminSermonsScreen />,
    )
    await findByText('page 0')

    await act(async () => {
      await fireEvent(getByTestId(LIST_TEST_ID), 'onEndReached')
    })

    expect(await findByText(RETRY_LABEL)).toBeTruthy()

    await act(async () => {
      await fireEvent.press(await findByText(RETRY_LABEL))
    })

    await waitFor(() => expect(queryByText(RETRY_LABEL)).toBeNull())
    // The appended row is beyond FlatList's initial window, so assert the count
    // (sermons.length) instead of the off-screen title.
    expect(await findByText('Всего: 21')).toBeTruthy()

    unmount()
  })

  test('shows the upload icon button in the header', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { findByRole } = await renderWithProviders(<AdminSermonsScreen />)

    expect(await findByRole('button', { name: CREATE_BUTTON_LABEL })).toBeTruthy()
  })

  test('floats the create action in the fixed top-right slot in the wide layout', async () => {
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { getByLabelText, getByTestId } = await renderWithProviders(<AdminSermonsScreen />)

    const overlay = getByTestId(WIDE_TOP_ACTIONS_TEST_ID)

    expect(within(overlay).getByLabelText(CREATE_BUTTON_LABEL)).toBeTruthy()
    expect(hasScrollAncestor(getByLabelText(CREATE_BUTTON_LABEL))).toBe(false)
  })

  test('keeps the create action in the list header in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)
    mockFindAll.mockResolvedValue({ count: 0, nextCursor: null, sermons: [] })

    const { getByLabelText, queryByTestId } = await renderWithProviders(<AdminSermonsScreen />)

    expect(queryByTestId(WIDE_TOP_ACTIONS_TEST_ID)).toBeNull()
    expect(hasScrollAncestor(getByLabelText(CREATE_BUTTON_LABEL))).toBe(true)
  })
})
