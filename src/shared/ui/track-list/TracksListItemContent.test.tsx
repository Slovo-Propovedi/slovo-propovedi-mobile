import { screen } from '@testing-library/react-native'
import { Text as MockText } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { TracksListItemContent } from './TracksListItemContent'

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
const ARTWORK_TEST_ID = 'tracks-list-item-artwork'
const TEST_TITLE = 'Test Title'

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
  title: TEST_TITLE,
}

describe('<TracksListItemContent>', () => {
  beforeEach(() => {
    mockIconSpy.mockClear()
  })

  test('renders cloud icon when not cached, not downloading, not queued', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} />)

    expect(mockIconSpy).toHaveBeenCalledWith(expect.objectContaining({ name: CLOUD_DOWNLOAD_ICON }))
  })

  test('renders clock icon when queued', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isQueued={true} />)

    expect(mockIconSpy).toHaveBeenCalledWith(expect.objectContaining({ name: CLOCK_ICON }))
    expect(mockIconSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: CLOUD_DOWNLOAD_ICON }),
    )
  })

  test('renders progress bar when downloading and no clock icon', async () => {
    await renderWithProviders(
      <TracksListItemContent {...baseProps} progressValue={0.5} isDownloading={true} />,
    )

    expect(mockIconSpy).not.toHaveBeenCalledWith(expect.objectContaining({ name: CLOCK_ICON }))
    expect(mockIconSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: CLOUD_DOWNLOAD_ICON }),
    )
  })

  test('renders no icon when cached and not playing', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isCached={true} />)

    expect(mockIconSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: CLOUD_DOWNLOAD_ICON }),
    )
    expect(mockIconSpy).not.toHaveBeenCalledWith(expect.objectContaining({ name: CLOCK_ICON }))
  })

  test('renders play icon when playing and not audio playing', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} isPlaying={true} />)

    expect(mockIconSpy).toHaveBeenCalledWith(expect.objectContaining({ name: PLAY_ICON }))
    expect(mockIconSpy).not.toHaveBeenCalledWith(expect.objectContaining({ name: CLOCK_ICON }))
  })

  test('dims title and artwork when progress is 1', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} progress={1} />)

    expect(screen.getAllByText(TEST_TITLE)[0]).toHaveStyle({ color: mockTheme.textMuted })
    expect(screen.getByTestId(ARTWORK_TEST_ID)).toHaveStyle({ opacity: 0.5 })
  })

  test('playing wins over completed dimming', async () => {
    await renderWithProviders(
      <TracksListItemContent {...baseProps} progress={1} isPlaying={true} />,
    )

    expect(screen.getAllByText(TEST_TITLE)[0]).toHaveStyle({ color: mockTheme.primary })
    expect(screen.getAllByText(TEST_TITLE)[0]).not.toHaveStyle({ color: mockTheme.textMuted })
    expect(screen.getByTestId(ARTWORK_TEST_ID)).toHaveStyle({ opacity: 0.6 })
  })

  test('does not dim when progress is below 1', async () => {
    await renderWithProviders(<TracksListItemContent {...baseProps} progress={0.5} />)

    expect(screen.getAllByText(TEST_TITLE)[0]).not.toHaveStyle({ color: mockTheme.textMuted })
    expect(screen.getByTestId(ARTWORK_TEST_ID)).not.toHaveStyle({ opacity: 0.5 })
  })
})
