import { fireEvent } from '@testing-library/react-native'
import { type ComponentProps } from 'react'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { LightTheme } from 'shared/ui/theme'
import type { GestureType } from 'react-native-gesture-handler'
import type { TestInstance } from 'test-renderer'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles } from './miniStyles'

jest.mock('react-native-text-ticker', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    __esModule: true,
    default: (props: { children: string; style?: unknown }) => (
      <Text style={props.style as never}>{props.children}</Text>
    ),
  }
})

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

type MiniPlayerProps = ComponentProps<typeof MiniPlayer>

const AUDIO_URL = 'https://example.com/audio.mp3'
const ARTWORK_URL = 'https://example.com/artwork.jpg'
const APP_NAME = 'Слово.Проповеди'
const REFERENCE_TEXT = 'Бытие 1:5'
const BUFFERING_INDICATOR_TEST_ID = 'buffering-indicator'
const PLAY_ICON = 'controller-play'
const PAUSE_ICON = 'controller-paus'

const AUDIO: AudioPlayerData = {
  artist: 'Автор',
  artwork: ARTWORK_URL,
  audioUrl: AUDIO_URL,
  book: 'Бытие',
  chapter: 1,
  id: 'sermon-1',
  title: 'Первая проповедь',
  verse: 5,
}

const PLAYLIST: PlaylistData = {
  artwork: null,
  description: 'Описание плейлиста',
  id: 'pl-1',
  sermons: [],
  title: 'Плейлист о вере',
}

const mockOnPlayPause = jest.fn().mockResolvedValue(undefined)
const mockOnPress = jest.fn()

const baseProps: MiniPlayerProps = {
  audio: AUDIO,
  currentTheme: LightTheme,
  downloadProgress: 0,
  isDownloading: false,
  miniPan: {} as GestureType,
  miniStyle: {},
  miniStyles: createMiniStyles(LightTheme, 0, 400),
  onPlayPause: mockOnPlayPause,
  onPress: mockOnPress,
  playing: false,
  playlist: null,
  showSpinner: false,
}

const renderMiniPlayer = (overrides: Partial<MiniPlayerProps> = {}) =>
  renderWithProviders(<MiniPlayer {...baseProps} {...overrides} />)

const queryProgressFill = (container: TestInstance, progress: number) =>
  container.queryAll(node => {
    const style = node.props.style
    if (!Array.isArray(style)) return false
    return style.some((s: { width?: string } | null) => s?.width === `${progress * 100}%`)
  })

describe('<MiniPlayer>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the track title and artwork', async () => {
    const { container, getByText } = await renderMiniPlayer()

    expect(getByText(AUDIO.title)).toBeTruthy()

    const artwork = container.queryAll(node => node.props.source?.uri === ARTWORK_URL)
    expect(artwork).toHaveLength(1)
  })

  test('shows the sermon reference as the subtitle', async () => {
    const { getByText } = await renderMiniPlayer()

    expect(getByText(REFERENCE_TEXT)).toBeTruthy()
  })

  test('falls back to the playlist title, then the app name, when no reference', async () => {
    const noReferenceAudio = { ...AUDIO, book: null, chapter: null, verse: null }

    const withPlaylist = await renderMiniPlayer({ audio: noReferenceAudio, playlist: PLAYLIST })
    expect(withPlaylist.getByText(PLAYLIST.title)).toBeTruthy()

    const withoutPlaylist = await renderMiniPlayer({ audio: noReferenceAudio })
    expect(withoutPlaylist.getByText(APP_NAME)).toBeTruthy()
  })

  test('pressing the mini player calls the expand callback', async () => {
    const { getByText } = await renderMiniPlayer()

    await fireEvent.press(getByText(AUDIO.title))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  test('pressing the play/pause button calls onPlayPause', async () => {
    const { getByRole } = await renderMiniPlayer()

    await fireEvent.press(getByRole('button'))

    expect(mockOnPlayPause).toHaveBeenCalledTimes(1)
  })

  test('shows the play icon when paused and the pause icon when playing', async () => {
    const paused = await renderMiniPlayer({ playing: false })
    expect(paused.getByText(PLAY_ICON)).toBeTruthy()

    const playing = await renderMiniPlayer({ playing: true })
    expect(playing.getByText(PAUSE_ICON)).toBeTruthy()
  })

  test('gates the buffering spinner on showSpinner', async () => {
    const buffering = await renderMiniPlayer({ showSpinner: true })
    expect(buffering.getByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeTruthy()
    expect(buffering.queryByRole('button')).toBeNull()

    const ready = await renderMiniPlayer({ showSpinner: false })
    expect(ready.queryByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeNull()
    expect(ready.getByRole('button')).toBeTruthy()
  })

  test('keeps the spinner while buffering even when playing', async () => {
    const { getByTestId, queryByRole } = await renderMiniPlayer({
      playing: true,
      showSpinner: true,
    })

    expect(getByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeTruthy()
    expect(queryByRole('button')).toBeNull()
  })

  test('shows the download progress bar while downloading', async () => {
    const downloading = await renderMiniPlayer({ downloadProgress: 0.5, isDownloading: true })
    expect(queryProgressFill(downloading.container, 0.5)).toHaveLength(1)

    const idle = await renderMiniPlayer({ isDownloading: false })
    expect(queryProgressFill(idle.container, 0.5)).toHaveLength(0)
  })
})
