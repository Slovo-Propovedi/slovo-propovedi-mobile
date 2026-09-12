import { screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { PlaylistSheetRow } from './PlaylistSheetRow'

const mockedUseIsDownloadingUrl = jest.fn((_audioUrl: null | string) => false)

jest.mock('entities/player', () => ({
  useIsDownloadingUrl: (audioUrl: null | string) => mockedUseIsDownloadingUrl(audioUrl),
}))

jest.mock('shared/ui/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: {
      isDownloading?: boolean
      menuActions?: Array<{ text: string }>
      progress?: number
      title: string
    }) => (
      <View testID='tracks-list-item'>
        <Text>{props.title}</Text>
        {props.isDownloading && <Text testID='downloading-indicator'>downloading</Text>}
        {props.menuActions?.map(action => (
          <Text key={action.text}>{action.text}</Text>
        ))}
        {props.progress != null && props.progress > 0 && (
          <View
            testID='progress-bar'
            accessibilityLabel={`${Math.round(props.progress * 100)}% progress`}
          />
        )}
      </View>
    ),
  }
})

const PROGRESS_BAR_TEST_ID = 'progress-bar'
const DOWNLOADING_INDICATOR_TEST_ID = 'downloading-indicator'
const SERMON_ID = 'sheet-sermon-1'
const TEST_TITLE = 'Bottom Sheet Sermon'
const REMOVE_ACTION_TEXT = 'Удалить из истории'
const AUDIO_URL = 'https://example.com/sheet.mp3'

const defaultProps = {
  id: SERMON_ID,
  index: 0,
  isPlaying: false,
  onPress: jest.fn(),
  title: TEST_TITLE,
}

const renderItem = (props?: Partial<React.ComponentProps<typeof PlaylistSheetRow>>) =>
  renderWithProviders(<PlaylistSheetRow {...defaultProps} {...props} />)

describe('<PlaylistSheetRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseIsDownloadingUrl.mockReturnValue(false)
  })

  test('renders progress bar from storedProgress', async () => {
    await renderItem({ storedProgress: 0.5 })

    expect(screen.getByTestId(PROGRESS_BAR_TEST_ID)).toBeTruthy()
    expect(screen.getByLabelText('50% progress')).toBeTruthy()
  })

  test('does not render progress bar when no progress is available', async () => {
    await renderItem()

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })

  test('does not render progress bar when storedProgress is 0', async () => {
    await renderItem({ storedProgress: 0 })

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })

  test('forwards menuActions to TracksListItem', async () => {
    const menuActions = [
      { icon: 'trash-outline' as const, onPress: jest.fn(), text: REMOVE_ACTION_TEXT },
    ]

    await renderItem({ menuActions })

    expect(screen.getByText(REMOVE_ACTION_TEXT)).toBeTruthy()
  })

  test('forwards isDownloading to TracksListItem when the url is downloading', async () => {
    mockedUseIsDownloadingUrl.mockReturnValue(true)

    await renderItem({ audioUrl: AUDIO_URL })

    expect(screen.getByTestId(DOWNLOADING_INDICATOR_TEST_ID)).toBeTruthy()
    expect(mockedUseIsDownloadingUrl).toHaveBeenCalledWith(AUDIO_URL)
  })
})
