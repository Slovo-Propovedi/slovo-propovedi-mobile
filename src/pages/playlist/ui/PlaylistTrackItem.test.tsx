import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { useSermonProgress } from 'entities/listening-history'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { PlaylistTrackItem } from './PlaylistTrackItem'

jest.mock('entities/listening-history', () => ({
  useSermonProgress: jest.fn((_id: string, stored?: number) => stored),
}))

jest.mock('shared/ui/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: { progress?: number; title: string }) => (
      <View testID='tracks-list-item'>
        <Text>{props.title}</Text>
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
const SERMON_ID = 'sermon-1'
const TEST_TITLE = 'Test Sermon'

const defaultProps = {
  artwork: '',
  id: SERMON_ID,
  index: 0,
  isPlaying: false,
  onPress: jest.fn(),
  title: TEST_TITLE,
}

const renderItem = (props?: Partial<React.ComponentProps<typeof PlaylistTrackItem>>) =>
  renderWithProviders(<PlaylistTrackItem {...defaultProps} {...props} />)

describe('<PlaylistTrackItem>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders TracksListItem with storedProgress when no live progress', async () => {
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

  test('live progress overrides storedProgress', async () => {
    jest.mocked(useSermonProgress).mockReturnValue(0.8)

    await renderItem({ storedProgress: 0.3 })

    expect(screen.getByLabelText('80% progress')).toBeTruthy()
    expect(screen.queryByLabelText('30% progress')).toBeNull()
  })
})
