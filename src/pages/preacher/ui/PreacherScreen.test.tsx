import { act, fireEvent, screen } from '@testing-library/react-native'
import { mapSermonEntityToSermonData } from 'entities/sermon'
import { sermonsMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { usePreacherSermons } from '../lib/usePreacherSermons'
import { PreacherScreen } from './PreacherScreen'

const mockUsePreacherSermons = usePreacherSermons as jest.MockedFunction<typeof usePreacherSermons>
const mockSetHeaderTitle = jest.fn()
const mockUseScreenTransitionTracking = jest.fn()
const mockParams: { artist?: string } = {}

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}))

jest.mock('shared/routing/useHeaderTitle', () => ({
  useHeaderTitle: () => mockSetHeaderTitle,
}))

jest.mock('shared/routing', () => ({
  ...jest.requireActual('shared/routing'),
  useScreenTransitionTracking: () => mockUseScreenTransitionTracking(),
}))

jest.mock('../lib/usePreacherSermons', () => ({
  usePreacherSermons: jest.fn(),
}))

jest.mock('entities/player', () => ({
  usePlayNewSermon: jest.fn(),
}))

jest.mock('entities/offline-cache', () => ({
  useTrackItemCache: jest.fn(() => ({
    isCached: false,
    isCacheDisabled: false,
    isDownloading: false,
    isQueued: false,
    isSermonCachingEnabled: true,
    progressValue: -1,
    toggleCache: jest.fn(),
    visualState: 'cloud',
  })),
}))

jest.mock('entities/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')

  const TracksListItem = (props: { onPress: () => void; title: string }) => (
    <Text onPress={props.onPress}>{props.title}</Text>
  )
  TracksListItem.Skeleton = () => <View testID='tracks-list-item-skeleton' />

  return {
    TRACK_LIST_ITEM_SIZES: jest.requireActual('entities/track-list').TRACK_LIST_ITEM_SIZES,
    TracksListItem,
  }
})

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => []),
}))

const ARTIST = 'Иван Иванов'
const EMPTY_MESSAGE = 'Проповедей пока нет'
const INVALID_ARTIST_MESSAGE = 'Проповедник не найден'
const RETRY_LABEL = 'Повторить загрузку'

const buildSermon = (id: string) =>
  mapSermonEntityToSermonData(sermonsMocks.getSermonControllerFindOneResponseMock({ id }))

const createState = (overrides: Partial<ReturnType<typeof usePreacherSermons>> = {}) => ({
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  items: [],
  loadMore: jest.fn(),
  loadMoreFailed: false,
  ...overrides,
})

const renderScreen = () => renderWithProviders(<PreacherScreen />)

const getList = () =>
  screen.root?.queryAll(
    instance =>
      instance.props.onEndReached !== undefined && instance.props.onEndReachedThreshold === 0.4,
  )[0]

describe('<PreacherScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockParams.artist = ARTIST
  })

  test('renders the preacher sermons and sets the header title', async () => {
    const items = [buildSermon('s1'), buildSermon('s2')]
    mockUsePreacherSermons.mockReturnValue(createState({ items }))

    await renderScreen()

    expect(screen.getByText(items[0].title)).toBeTruthy()
    expect(screen.getByText(items[1].title)).toBeTruthy()
    expect(mockUsePreacherSermons).toHaveBeenCalledWith(ARTIST)
    expect(mockSetHeaderTitle).toHaveBeenCalledWith(ARTIST)
    expect(mockUseScreenTransitionTracking).toHaveBeenCalledTimes(1)
  })

  test('loads the next page when the list end is reached', async () => {
    const state = createState({ hasMore: true, items: [buildSermon('s1')] })
    mockUsePreacherSermons.mockReturnValue(state)

    await renderScreen()

    await act(async () => {
      getList()?.props.onEndReached()
    })

    expect(state.loadMore).toHaveBeenCalledTimes(1)
  })

  test('shows a footer spinner while the next page is loading', async () => {
    mockUsePreacherSermons.mockReturnValue(
      createState({ hasMore: true, isLoadingMore: true, items: [buildSermon('s1')] }),
    )

    const { container } = await renderScreen()

    expect(container.queryAll(node => node.type === 'ActivityIndicator')).toHaveLength(1)
  })

  test('retries a failed next page', async () => {
    const state = createState({ hasMore: true, loadMoreFailed: true })
    mockUsePreacherSermons.mockReturnValue(state)

    await renderScreen()
    await act(async () => {
      fireEvent.press(screen.getByText(RETRY_LABEL))
    })

    expect(state.loadMore).toHaveBeenCalledTimes(1)
  })

  test('shows the empty state when the preacher has no sermons', async () => {
    mockUsePreacherSermons.mockReturnValue(createState())

    await renderScreen()

    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy()
  })

  test('shows the invalid preacher state without fetching for a missing artist', async () => {
    mockParams.artist = undefined
    mockUsePreacherSermons.mockReturnValue(createState())

    await renderScreen()

    expect(screen.getByText(INVALID_ARTIST_MESSAGE)).toBeTruthy()
    expect(mockUsePreacherSermons).toHaveBeenCalledWith('')
    expect(mockSetHeaderTitle).not.toHaveBeenCalled()
  })
})
