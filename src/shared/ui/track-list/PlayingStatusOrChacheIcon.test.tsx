import { screen } from '@testing-library/react-native'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'

const mockIconSpy = jest.fn()

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: { name: string }) => {
    mockIconSpy(props)
    return <MockText>{props.name}</MockText>
  },
}))

const CLOUD_DOWNLOAD_ICON = 'cloud-download-outline'
const CLOCK_ICON = 'clock-outline'
const PLAY_ICON = 'play'

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

const expectIconRendered = (name: string) =>
  expect(mockIconSpy).toHaveBeenCalledWith(expect.objectContaining({ name }))

const expectIconNotRendered = (name: string) =>
  expect(mockIconSpy).not.toHaveBeenCalledWith(expect.objectContaining({ name }))

describe('<PlayingStatusOrChacheIcon>', () => {
  beforeEach(() => {
    mockIconSpy.mockClear()
  })

  test('renders cloud-download-outline icon when isPlaying is false', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={false} theme={mockTheme} isAudioPlaying={false} />,
    )

    expectIconRendered(CLOUD_DOWNLOAD_ICON)
  })

  test('renders cloud-download-outline icon when isPlaying is false regardless of isAudioPlaying', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={false} theme={mockTheme} isAudioPlaying={true} />,
    )

    expectIconRendered(CLOUD_DOWNLOAD_ICON)
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

    expectIconRendered(CLOCK_ICON)
    expectIconNotRendered(CLOUD_DOWNLOAD_ICON)
  })

  test('renders play icon when isPlaying is true and isAudioPlaying is false', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={true} theme={mockTheme} isAudioPlaying={false} />,
    )

    expectIconRendered(PLAY_ICON)
    expectIconNotRendered(CLOUD_DOWNLOAD_ICON)
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

    expectIconRendered(PLAY_ICON)
    expectIconNotRendered(CLOCK_ICON)
  })

  test('renders AnimatedSoundBars when both isPlaying and isAudioPlaying are true', async () => {
    await renderWithProviders(
      <PlayingStatusOrChacheIcon isPlaying={true} theme={mockTheme} isAudioPlaying={true} />,
    )

    const tree = screen.toJSON()
    expect(tree).toBeTruthy()

    expectIconNotRendered(PLAY_ICON)
    expectIconNotRendered(CLOUD_DOWNLOAD_ICON)
  })
})
