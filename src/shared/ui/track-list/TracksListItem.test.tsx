import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text as MockText } from 'react-native'
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
  MaterialCommunityIcons: (props: { name: string }) => (
    <MockText testID={`icon-${props.name}`}>{props.name}</MockText>
  ),
}))

jest.mock('react-native-text-ticker', () => ({
  __esModule: true,
  default: (props: { children: string }) => <MockText>{props.children}</MockText>,
}))

jest.mock('./TracksListItemContextMenu', () => ({
  TracksListItemContextMenu: (props: { isMenuOpen: boolean }) => {
    if (!props.isMenuOpen) return null
    return <MockText testID='context-menu-visible'>Menu is open</MockText>
  },
}))

const CONTEXT_MENU_TEST_ID = 'context-menu-visible'
const DOTS_BUTTON_TEST_ID = 'tracks-list-item-menu'
const TRACK_ITEM_TEST_ID = 'tracks-list-item'
const AUDIO_URL = 'https://example.com/audio.mp3'
const TEST_ARTIST = 'Test Artist'
const TEST_TITLE = 'Test Title'

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
  })

  test('renders the title text', async () => {
    await renderItem()

    expect(screen.getByText(TEST_TITLE)).toBeTruthy()
  })

  test('renders artist text when artist prop is provided', async () => {
    await renderItem({ artist: TEST_ARTIST })

    expect(screen.getByText(TEST_ARTIST)).toBeTruthy()
  })

  test('does not render artist when artist prop is omitted', async () => {
    await renderItem()

    expect(screen.queryByText(TEST_ARTIST)).toBeNull()
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

  test('pressing dots button does NOT open menu when audioUrl is empty', async () => {
    await renderItem()

    fireEvent.press(screen.getByTestId(DOTS_BUTTON_TEST_ID))

    expect(screen.queryByTestId(CONTEXT_MENU_TEST_ID)).toBeNull()
  })
})
