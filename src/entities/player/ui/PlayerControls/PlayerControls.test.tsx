import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { PlayerControls } from './PlayerControls'
import '@testing-library/jest-native/extend-expect'

const PREVIEW_URL = 'https://test.com/preview1.mp3'
const TEST_ARTIST = 'Test Artist'

jest.mock('../../lib/PlayerService', () => ({
  playerService: {
    getState: jest.fn(() => ({
      duration: 0,
      isBuffering: false,
      isPlaying: false,
      position: 0,
    })),
    loadAudio: jest.fn(),
    onTrackEnd: undefined,
    pause: jest.fn(),
    play: jest.fn(),
    seekTo: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    unload: jest.fn(),
  },
}))

const mockEntypoSpy = jest.fn()

jest.mock('@expo/vector-icons', () => {
  const Actual = jest.requireActual('@expo/vector-icons')
  return {
    ...Actual,
    Entypo: (props: Record<string, unknown>) => {
      mockEntypoSpy(props)
      return <Actual.Entypo {...props} />
    },
  }
})

const mockUsePlayerState = jest.fn(() => ({
  currentAudio: null,
  duration: 0,
  isBuffering: false,
  isPlaying: false,
  position: 0,
  volume: 1,
}))

jest.mock('../../lib/usePlayerState', () => ({
  usePlayerState: () => mockUsePlayerState(),
}))

const currentPlaylist = {
  artwork: PREVIEW_URL,
  id: '1',
  sermons: [
    {
      artist: TEST_ARTIST,
      artwork: PREVIEW_URL,
      audioUrl: 'https://test.com/audio1.mp3',
      description: 'Description 1',
      id: '1',
      title: 'Title 1',
    },
    {
      artist: TEST_ARTIST,
      artwork: PREVIEW_URL,
      audioUrl: 'https://test.com/audio2.mp3',
      description: 'Description 2',
      id: '2',
      title: 'Title 2',
    },
    {
      artist: TEST_ARTIST,
      artwork: PREVIEW_URL,
      audioUrl: 'https://test.com/audio3.mp3',
      description: 'Description 3',
      id: '3',
      title: 'Title 3',
    },
  ],
  title: 'Playlist 1',
}

const getMockPlayerControlsProps = () => ({
  currentAudio: currentPlaylist.sermons[0],
  currentPlaylist,
  setCurrentAudio: jest.fn(),
})

let mockPlayerControlsProps = getMockPlayerControlsProps()

describe('<PlayerControls>', () => {
  beforeEach(() => {
    mockPlayerControlsProps = getMockPlayerControlsProps()
    mockEntypoSpy.mockClear()
    mockUsePlayerState.mockReturnValue({
      currentAudio: null,
      duration: 0,
      isBuffering: false,
      isPlaying: false,
      position: 0,
      volume: 1,
    })
    jest.clearAllMocks()
  })

  test('PlayerControls renders correctly', async () => {
    const { getByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    const controlsContainer = getByTestId('controls-container')
    expect(controlsContainer).toBeTruthy()
  })

  test('shows play button when not buffering and not downloading', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(getByTestId('play-button')).toBeTruthy()
    expect(queryByTestId('buffering-indicator')).toBeNull()
  })

  test('keeps play/pause button visible while playing', async () => {
    mockUsePlayerState.mockReturnValue({
      currentAudio: null,
      duration: 0,
      isBuffering: false,
      isPlaying: true,
      position: 0,
      volume: 1,
    })
    mockEntypoSpy.mockClear()
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(getByTestId('play-button')).toBeTruthy()
    expect(queryByTestId('buffering-indicator')).toBeNull()
    const iconNames = mockEntypoSpy.mock.calls.map(
      (call: [Record<string, unknown>]) => call[0].name,
    )
    expect(iconNames).toContain('controller-paus')
    expect(iconNames).not.toContain('controller-play')
  })

  test('shows spinner when buffering', async () => {
    mockUsePlayerState.mockReturnValue({
      currentAudio: null,
      duration: 0,
      isBuffering: true,
      isPlaying: false,
      position: 0,
      volume: 1,
    })
    const { queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(queryByTestId('play-button')).toBeNull()
    expect(queryByTestId('buffering-indicator')).toBeTruthy()
  })

  test('fullscreen renders next button on last track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} variant='fullscreen' />,
    )
    expect(getByTestId('next-button')).toBeTruthy()
  })

  test('fullscreen renders prev button on first track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[0]
    const { getByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} variant='fullscreen' />,
    )
    expect(getByTestId('prev-button')).toBeTruthy()
  })

  test('default variant keeps next button enabled on last track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(getByTestId('next-button').props.disabled).toBeFalsy()
  })

  test('tap at playlist boundary is a no-op (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    fireEvent.press(getByTestId('next-button'))
    expect(mockPlayerControlsProps.setCurrentAudio).not.toHaveBeenCalled()
  })
})
