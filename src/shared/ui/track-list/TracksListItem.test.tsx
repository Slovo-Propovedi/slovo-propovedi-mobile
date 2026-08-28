import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text as MockText, View } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TracksListItem } from './TracksListItem'

jest.mock('./useTrackItemCache', () => ({
  useTrackItemCache: jest.fn(() => ({
    isCached: false,
    isDownloading: false,
    progressValue: -1,
    toggleCache: jest.fn(),
  })),
}))

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => (
    <MockText testID={`icon-${props.name}`}>{props.name}</MockText>
  ),
  MaterialCommunityIcons: (props: { name: string }) => (
    <MockText testID={`icon-${props.name}`}>{props.name}</MockText>
  ),
}))

jest.mock('react-native-text-ticker', () => ({
  __esModule: true,
  default: (props: { children: string }) => <MockText>{props.children}</MockText>,
}))

let mockLastMenuAnchor: { height: number; width: number; x: number; y: number } | null = null

jest.mock('./TracksListItemContextMenu', () => ({
  TracksListItemContextMenu: (props: {
    anchor: { height: number; width: number; x: number; y: number } | null
    isMenuOpen: boolean
  }) => {
    mockLastMenuAnchor = props.anchor
    if (!props.isMenuOpen) return null
    return <MockText testID='context-menu-visible'>Menu is open</MockText>
  },
}))

jest.mock('../progress-bar/ProgressBar', () => {
  const { View: RNView } = jest.requireActual('react-native')
  return {
    ProgressBar: (props: { progress: number }) => (
      <RNView
        testID='progress-bar'
        accessibilityLabel={`${Math.round(props.progress * 100)}% progress`}
      />
    ),
  }
})

const CONTEXT_MENU_TEST_ID = 'context-menu-visible'
const DOTS_BUTTON_TEST_ID = 'tracks-list-item-menu'
const PROGRESS_BAR_TEST_ID = 'progress-bar'
const TRACK_ITEM_TEST_ID = 'tracks-list-item'
const AUDIO_URL = 'https://example.com/audio.mp3'
const TEST_SUBTITLE = 'Test Subtitle'
const TEST_TITLE = 'Test Title'

// Fixed geometry returned by the mocked View.prototype.measure
const MOCK_MEASURE_PAGE_X = 200
const MOCK_MEASURE_PAGE_Y = 300
const MOCK_MEASURE_WIDTH = 36
const MOCK_MEASURE_HEIGHT = 36

const defaultProps = {
  isPlaying: false,
  onPress: jest.fn(),
  title: TEST_TITLE,
}

const renderItem = async (props?: Partial<React.ComponentProps<typeof TracksListItem>>) =>
  renderWithProviders(<TracksListItem {...defaultProps} {...props} />)

describe('<TracksListItem>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLastMenuAnchor = null
    // In Jest, host-component measure never fires its callback, so the menu
    // would never receive a position. Mock the measurement with fixed geometry.
    jest
      .spyOn(View.prototype, 'measure')
      .mockImplementation(
        (
          cb: (
            x: number,
            y: number,
            width: number,
            height: number,
            pageX: number,
            pageY: number,
          ) => void,
        ) => {
          cb(
            0,
            0,
            MOCK_MEASURE_WIDTH,
            MOCK_MEASURE_HEIGHT,
            MOCK_MEASURE_PAGE_X,
            MOCK_MEASURE_PAGE_Y,
          )
          return undefined
        },
      )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the title text', async () => {
    await renderItem()

    expect(screen.getByText(TEST_TITLE)).toBeTruthy()
  })

  test('renders subtitle text when subtitle prop is provided', async () => {
    await renderItem({ subtitle: TEST_SUBTITLE })

    expect(screen.getByText(TEST_SUBTITLE)).toBeTruthy()
  })

  test('does not render subtitle when subtitle prop is omitted', async () => {
    await renderItem()

    expect(screen.queryByText(TEST_SUBTITLE)).toBeNull()
  })

  test('pressing the main item calls onPress', async () => {
    const mockOnPress = jest.fn()
    await renderItem({ onPress: mockOnPress })

    fireEvent.press(screen.getByTestId(TRACK_ITEM_TEST_ID))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  test('pressing dots button opens context menu when audioUrl is provided', async () => {
    await renderItem({ audioUrl: AUDIO_URL })

    expect(screen.queryByTestId(CONTEXT_MENU_TEST_ID)).toBeNull()

    fireEvent.press(screen.getByTestId(DOTS_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(screen.getByTestId(CONTEXT_MENU_TEST_ID)).toBeTruthy()
    })
  })

  test('anchors context menu to the dots button using measured geometry', async () => {
    await renderItem({ audioUrl: AUDIO_URL })

    fireEvent.press(screen.getByTestId(DOTS_BUTTON_TEST_ID))

    await waitFor(() => {
      expect(mockLastMenuAnchor).toEqual({
        height: MOCK_MEASURE_HEIGHT,
        width: MOCK_MEASURE_WIDTH,
        x: MOCK_MEASURE_PAGE_X,
        y: MOCK_MEASURE_PAGE_Y,
      })
    })
  })

  test('pressing dots button does NOT open menu when audioUrl is empty', async () => {
    await renderItem()

    fireEvent.press(screen.getByTestId(DOTS_BUTTON_TEST_ID))

    expect(screen.queryByTestId(CONTEXT_MENU_TEST_ID)).toBeNull()
  })

  test('renders ProgressBar when progress is greater than 0', async () => {
    await renderItem({ progress: 0.5 })

    expect(screen.getByTestId(PROGRESS_BAR_TEST_ID)).toBeTruthy()
  })

  test('does not render ProgressBar when progress is undefined', async () => {
    await renderItem()

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })

  test('does not render ProgressBar when progress is 0', async () => {
    await renderItem({ progress: 0 })

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })
})
