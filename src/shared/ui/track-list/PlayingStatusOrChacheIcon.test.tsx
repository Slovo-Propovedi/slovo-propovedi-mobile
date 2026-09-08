import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: { name: string }) => (
    <MockText testID={`icon-${props.name}`}>{props.name}</MockText>
  ),
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

describe('<PlayingStatusOrChacheIcon>', () => {
  test('renders cloud-download-outline icon when isPlaying is false', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={false} theme={mockTheme} isAudioPlaying={false} />,
    )

    const icon = screen.getByTestId(CLOUD_DOWNLOAD_ICON)
    expect(icon).toBeTruthy()
  })

  test('renders cloud-download-outline icon when isPlaying is false regardless of isAudioPlaying', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={false} theme={mockTheme} isAudioPlaying={true} />,
    )

    const icon = screen.getByTestId(CLOUD_DOWNLOAD_ICON)
    expect(icon).toBeTruthy()
  })

  test('renders clock-outline icon when queued and not playing', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon
        isQueued={true}
        isPlaying={false}
        theme={mockTheme}
        isAudioPlaying={false}
      />,
    )

    const icon = screen.getByTestId(CLOCK_ICON)
    expect(icon).toBeTruthy()
    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
  })

  test('renders play icon when isPlaying is true and isAudioPlaying is false', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={true} theme={mockTheme} isAudioPlaying={false} />,
    )

    const playIcon = screen.getByTestId('icon-play')
    expect(playIcon).toBeTruthy()

    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
  })

  test('renders play icon over clock when playing and queued', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon
        isQueued={true}
        isPlaying={true}
        theme={mockTheme}
        isAudioPlaying={false}
      />,
    )

    expect(screen.getByTestId('icon-play')).toBeTruthy()
    expect(screen.queryByTestId(CLOCK_ICON)).toBeNull()
  })

  test('renders AnimatedSoundBars when both isPlaying and isAudioPlaying are true', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={true} theme={mockTheme} isAudioPlaying={true} />,
    )

    const tree = screen.toJSON()
    expect(tree).toBeTruthy()

    expect(screen.queryByTestId('icon-play')).toBeNull()
    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
  })
})
