import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { useSermonProgress } from 'entities/listening-history'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { SermonData } from 'shared/model'
import { SermonSearchRow } from './SermonSearchRow'

jest.mock('entities/listening-history', () => ({
  useSermonProgress: jest.fn((_id: string, stored?: number) => stored),
}))

jest.mock('shared/ui', () => {
  const { View } = jest.requireActual('react-native')
  return {
    CoverImage: () => <View testID='cover-image' />,
    ProgressBar: (props: { progress: number }) => (
      <View
        testID='progress-bar'
        accessibilityLabel={`${Math.round(props.progress * 100)}% progress`}
      />
    ),
  }
})

const PROGRESS_BAR_TEST_ID = 'progress-bar'
const SERMON_ID = 'search-sermon-1'

const sermon: SermonData = {
  artist: 'Пастор',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: SERMON_ID,
  title: 'Проповедь о вере',
}

const defaultProps = {
  onPress: jest.fn(),
  sermon,
}

const renderItem = (props?: Partial<React.ComponentProps<typeof SermonSearchRow>>) =>
  renderWithProviders(<SermonSearchRow {...defaultProps} {...props} />)

describe('<SermonSearchRow>', () => {
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

  test('live progress overrides storedProgress', async () => {
    jest.mocked(useSermonProgress).mockReturnValue(0.7)

    await renderItem({ storedProgress: 0.4 })

    expect(screen.getByLabelText('70% progress')).toBeTruthy()
    expect(screen.queryByLabelText('40% progress')).toBeNull()
  })
})
