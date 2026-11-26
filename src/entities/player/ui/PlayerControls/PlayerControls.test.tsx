import { fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { COLORS } from 'shared/ui/theme'
import { PlayerControls } from './PlayerControls'

const PREVIEW_URL = 'https://test.com/preview1.mp3'
const TEST_ARTIST = 'Test Artist'
const PLAY_LABEL = 'Воспроизвести'
const PAUSE_LABEL = 'Пауза'
const NEXT_LABEL = 'Следующая проповедь'
const PREV_LABEL = 'Предыдущая проповедь'

jest.mock('../../lib/PlayerService', () => ({
  playerService: {
    pause: jest.fn(),
    play: jest.fn(),
    replaceAudio: jest.fn(),
    resumeAfterPause: jest.fn(),
    seekTo: jest.fn(),
    setLockScreenMetadata: jest.fn(),
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
    const { getByRole, queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(getByRole('button', { name: PLAY_LABEL })).toBeTruthy()
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
    const { getByRole, queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(getByRole('button', { name: PAUSE_LABEL })).toBeTruthy()
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
    const { queryByRole, queryByTestId } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} />,
    )
    expect(queryByRole('button', { name: new RegExp(`${PLAY_LABEL}|${PAUSE_LABEL}`) })).toBeNull()
    expect(queryByTestId('buffering-indicator')).toBeTruthy()
  })

  test('fullscreen renders next button on last track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByRole } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} variant='fullscreen' />,
    )
    expect(getByRole('button', { name: NEXT_LABEL })).toBeTruthy()
  })

  test('fullscreen renders prev button on first track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[0]
    const { getByRole } = await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} variant='fullscreen' />,
    )
    expect(getByRole('button', { name: PREV_LABEL })).toBeTruthy()
  })

  test('default variant keeps next button enabled on last track (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByRole } = await renderWithProviders(<PlayerControls {...mockPlayerControlsProps} />)
    expect(getByRole('button', { name: NEXT_LABEL }).props.disabled).toBeFalsy()
  })

  test('tap at playlist boundary is a no-op (Issue #67)', async () => {
    mockPlayerControlsProps.currentAudio = currentPlaylist.sermons[2]
    const { getByRole } = await renderWithProviders(<PlayerControls {...mockPlayerControlsProps} />)
    fireEvent.press(getByRole('button', { name: NEXT_LABEL }))
    expect(mockPlayerControlsProps.setCurrentAudio).not.toHaveBeenCalled()
  })

  test('colors the default transport icons with the provided color', async () => {
    mockEntypoSpy.mockClear()

    await renderWithProviders(<PlayerControls {...mockPlayerControlsProps} color='#fff' />)

    const colors = mockEntypoSpy.mock.calls.map(([props]) => StyleSheet.flatten(props.style).color)
    expect(colors.length).toBeGreaterThan(0)
    expect(colors.every(color => color === '#fff')).toBe(true)
  })

  test('keeps the black icon default when no color is provided', async () => {
    mockEntypoSpy.mockClear()

    await renderWithProviders(<PlayerControls {...mockPlayerControlsProps} />)

    const colors = mockEntypoSpy.mock.calls.map(([props]) => StyleSheet.flatten(props.style).color)
    expect(colors.every(color => color === COLORS.black)).toBe(true)
  })

  test('fullscreen transport stays white regardless of the color prop', async () => {
    mockEntypoSpy.mockClear()

    await renderWithProviders(
      <PlayerControls {...mockPlayerControlsProps} color='#f00' variant='fullscreen' />,
    )

    const colors = mockEntypoSpy.mock.calls.map(([props]) => StyleSheet.flatten(props.style).color)
    expect(colors.length).toBeGreaterThan(0)
    expect(colors.every(color => color === COLORS.white)).toBe(true)
  })
})
