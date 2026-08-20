import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { PlaylistSheetRow } from './PlaylistSheetRow'

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
const SERMON_ID = 'sheet-sermon-1'
const TEST_TITLE = 'Bottom Sheet Sermon'

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
})
