import { screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { PlaylistSheetRow } from './PlaylistSheetRow'

const mockedUseHistoryProgress = jest.fn(
  (_sermonId: string | undefined) => undefined as number | undefined,
)

jest.mock('entities/listening-history', () => ({
  useHistoryProgress: (sermonId: string | undefined) => mockedUseHistoryProgress(sermonId),
}))

jest.mock('shared/ui/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: {
      menuActions?: Array<{ text: string }>
      progress?: number
      title: string
    }) => (
      <View testID='tracks-list-item'>
        <Text>{props.title}</Text>
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
const SERMON_ID = 'sheet-sermon-1'
const TEST_TITLE = 'Bottom Sheet Sermon'
const REMOVE_ACTION_TEXT = 'Удалить из истории'

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
    mockedUseHistoryProgress.mockReturnValue(undefined)
  })

  test('renders progress bar from history progress', async () => {
    mockedUseHistoryProgress.mockReturnValue(0.5)

    await renderItem()

    expect(screen.getByTestId(PROGRESS_BAR_TEST_ID)).toBeTruthy()
    expect(screen.getByLabelText('50% progress')).toBeTruthy()
    expect(mockedUseHistoryProgress).toHaveBeenCalledWith(SERMON_ID)
  })

  test('does not render progress bar when no history progress is available', async () => {
    await renderItem()

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })

  test('does not render progress bar when history progress is 0', async () => {
    mockedUseHistoryProgress.mockReturnValue(0)

    await renderItem()

    expect(screen.queryByTestId(PROGRESS_BAR_TEST_ID)).toBeNull()
  })

  test('forwards menuActions to TracksListItem', async () => {
    const menuActions = [
      { icon: 'trash-outline' as const, onPress: jest.fn(), text: REMOVE_ACTION_TEXT },
    ]

    await renderItem({ menuActions })

    expect(screen.getByText(REMOVE_ACTION_TEXT)).toBeTruthy()
  })
})
