import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: { name: string }) => (
    <Text testID={`icon-${props.name}`}>{props.name}</Text>
  ),
}))

const CLOUD_DOWNLOAD_ICON = 'icon-cloud-download-outline'

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

  test('renders play icon when isPlaying is true and isAudioPlaying is false', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={true} theme={mockTheme} isAudioPlaying={false} />,
    )

    const playIcon = screen.getByTestId('icon-play')
    expect(playIcon).toBeTruthy()

    expect(screen.queryByTestId(CLOUD_DOWNLOAD_ICON)).toBeNull()
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
