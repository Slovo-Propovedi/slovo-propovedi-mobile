import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { TracksListItemContent } from './TracksListItemContent'

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: { name: string }) => (
    <MockText testID={`icon-${props.name}`}>{props.name}</MockText>
  ),
}))

jest.mock('react-native-text-ticker', () => ({
  __esModule: true,
  default: (props: { children: string }) => <MockText>{props.children}</MockText>,
}))

const CLOUD_DOWNLOAD_ICON = 'icon-cloud-download-outline'
const CLOCK_ICON = 'icon-clock-outline'

const mockTheme = {
  backdrop: 'rgba(0, 0, 0, 0.5)',
  background: '#fff',
  card: '#f5f5f5',
  icon: '#000',
  primary: '#f16031',
  skeleton: '#e0e0e0',
  surface: '#e8e8e8',
  text: '#000',
  textMuted: '#666',
}

const baseProps = {
  dotsOnPress: jest.fn(),
  isAudioPlaying: false,
  isCached: false,
  isDownloading: false,
  isPlaying: false,
  progressValue: -1,
  theme: mockTheme,
  title: 'Test Title',
}

describe('<TracksListItemContent>', () => {
  test('renders cloud icon when not cached, not downloading, not queued', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} />)

    expect(screen.getByTestId(CLOUD_DOWNLOAD_ICON)).toBeTruthy()
  })

  test('renders clock icon when queued', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isQueued={true} />)

    expect(screen.getByTestId(CLOCK_ICON)).toBeTruthy()
    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
  })

  test('renders progress bar when downloading and no clock icon', async () => {
    await renderWithProviders(
      <TracksListItemContent {...baseProps} progressValue={0.5} isDownloading={true} />,
    )

    expect(screen.queryByTestId(CLOCK_ICON)).toBeNull()
    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
  })

  test('renders no icon when cached and not playing', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isCached={true} />)

    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
    expect(screen.queryByTestId(CLOCK_ICON)).toBeNull()
  })

  test('renders play icon when playing and not audio playing', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isPlaying={true} />)

    expect(screen.getByTestId('icon-play')).toBeTruthy()
    expect(screen.queryByTestId(CLOCK_ICON)).toBeNull()
  })
})
