import { createCtx } from '@reatom/framework'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { type ComponentProps } from 'react'
import { StyleSheet } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import { onboardingTargetRectsAtom, onboardingTourAtom } from 'features/onboarding'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { getGlassBorder, getGlassFill, GLASS } from 'shared/ui'
import { DarkTheme, LightTheme } from 'shared/ui/theme'
import { MiniPlayer } from './MiniPlayer'
import { createMiniStyles, MINI_PLAY_BOX_SIZE, MINI_PLAY_HIT_SLOP } from './miniStyles'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn() }),
}))

// The mini player wires the title/subtitle marquee contract through MovingText;
// capturing its props is the cheapest honest check of that wiring (MarqueeText
// itself is covered by its own suite).
jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text } = jest.requireActual('react-native')
  const capturedMovingTextProps: Record<string, unknown>[] = []

  return {
    ...actual,
    __capturedMovingTextProps: capturedMovingTextProps,
    MovingText: (props: Record<string, unknown>) => {
      capturedMovingTextProps.push(props)

      return <Text>{String(props.text)}</Text>
    },
  }
})

const capturedMovingTextProps = (
  jest.requireMock('shared/ui') as { __capturedMovingTextProps: Record<string, unknown>[] }
).__capturedMovingTextProps

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: (props: Record<string, unknown>) => <View {...props} /> }
})

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

// The hook under test (useDownloadProgressForUrl) imports these atoms directly from
// 'entities/player/lib/download-model'. The factory must reuse the ACTUAL atom instances
// via jest.requireActual — creating fresh atoms here would break identity, and the hook
// would subscribe to different atoms than the test writes to.
jest.mock('entities/player', () => {
  const {
    bufferedProgressStateAtom,
    downloadingAudioUrlAtom,
    downloadProgressAtom,
    isDownloadingAtom,
  } = jest.requireActual('entities/player/lib/download-model')
  const { PlayerControlButton } = jest.requireActual(
    'entities/player/ui/control-button/control-button',
  )
  const { PlayerControlButtonType } = jest.requireActual(
    'entities/player/ui/control-button/control-button.types',
  )
  return {
    bufferedProgressStateAtom,
    downloadingAudioUrlAtom,
    downloadProgressAtom,
    isDownloadingAtom,
    PlayerControlButton,
    PlayerControlButtonType,
  }
})

type MiniPlayerProps = ComponentProps<typeof MiniPlayer>

const AUDIO_URL = 'https://example.com/audio.mp3'
const ARTWORK_URL = 'https://example.com/artwork.jpg'
const APP_NAME = 'Слово.Проповеди'
const REFERENCE_TEXT = 'Бытие 1:5'
const BUFFERING_INDICATOR_TEST_ID = 'buffering-indicator'
const PLAY_LABEL = 'Воспроизвести'
const PAUSE_LABEL = 'Пауза'
const SECTION_TITLE = 'Раздел'

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
  isLight: true,
  miniBarRestingStyle: {},
  miniBarStyle: {},
  miniPan: {} as GestureType,
  miniStyle: {},
  miniStyles: createMiniStyles(LightTheme, true),
  onPlayPause: mockOnPlayPause,
  onPress: mockOnPress,
  playing: false,
  playlist: null,
  showSpinner: false,
}

const renderMiniPlayer = (overrides: Partial<MiniPlayerProps> = {}) =>
  renderWithProviders(<MiniPlayer {...baseProps} {...overrides} />)

describe('<MiniPlayer>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedMovingTextProps.length = 0
  })

  test('renders the pill as frosted glass over the page', async () => {
    await renderMiniPlayer()

    const blurs = screen.root?.queryAll(
      instance => instance.props.intensity === GLASS.blur.intensity,
    )

    expect(blurs).toHaveLength(1)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(true),
    })
    expect(
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderColor === getGlassBorder(true) && flat?.borderWidth === 1
      }),
    ).toHaveLength(1)
    expect(
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
      ),
    ).toHaveLength(1)
  })

  test('does not paint a solid background over the pill glass', async () => {
    // The pill itself must stay background-free; any opaque fill here (or in the
    // layers below it) hides the BlurView backdrop and the pill reads as solid.
    await renderMiniPlayer()

    const pill = screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.boxShadow === GLASS.shadow.boxShadow,
    )?.[0]

    expect(pill).toBeTruthy()
    expect(StyleSheet.flatten(pill?.props.style)?.backgroundColor).toBeUndefined()
  })

  test('uses the dark glass recipe in the dark theme', async () => {
    await renderMiniPlayer({
      currentTheme: DarkTheme,
      isLight: false,
      miniStyles: createMiniStyles(DarkTheme, false),
    })

    const blurs = screen.root?.queryAll(
      instance => instance.props.intensity === GLASS.blur.intensity,
    )

    expect(blurs).toHaveLength(1)
    expect(StyleSheet.flatten(blurs?.[0]?.props.style)).toMatchObject({
      backgroundColor: getGlassFill(false),
    })
    expect(
      screen.root?.queryAll(instance => {
        const flat = StyleSheet.flatten(instance.props.style)

        return flat?.borderColor === getGlassBorder(false) && flat?.borderWidth === 1
      }),
    ).toHaveLength(1)
  })

  test('renders the track title and artwork', async () => {
    const { container, getAllByText } = await renderMiniPlayer()

    expect(getAllByText(AUDIO.title)[0]).toBeTruthy()

    const artwork = container.queryAll(node => node.props.source?.uri === ARTWORK_URL)
    expect(artwork).toHaveLength(1)
  })

  test('shows the sermon reference as the subtitle', async () => {
    const { getByText } = await renderMiniPlayer()

    expect(getByText(REFERENCE_TEXT)).toBeTruthy()
  })

  test('fades both lines and slaves the subtitle marquee to the title cycle', async () => {
    await renderMiniPlayer()

    const titleRow = capturedMovingTextProps.find(props => props.text === AUDIO.title)
    const subtitleRow = capturedMovingTextProps.find(props => props.text === REFERENCE_TEXT)

    expect(titleRow).toMatchObject({ autoStart: true, fadeEdge: true })
    expect(titleRow?.publishCycle).toBeDefined()
    expect(subtitleRow).toMatchObject({ fadeEdge: true })
    expect(subtitleRow?.autoStart).toBeUndefined()
    expect(subtitleRow?.followCycle).toBe(titleRow?.publishCycle)
  })

  test('falls back to the playlist title, then the app name, when no reference', async () => {
    const noReferenceAudio = { ...AUDIO, book: null, chapter: null, verse: null }

    const withPlaylist = await renderMiniPlayer({ audio: noReferenceAudio, playlist: PLAYLIST })
    expect(withPlaylist.getByText(PLAYLIST.title)).toBeTruthy()

    const withoutPlaylist = await renderMiniPlayer({ audio: noReferenceAudio })
    expect(withoutPlaylist.getByText(APP_NAME)).toBeTruthy()
  })

  test('prefers the section name when the playlist has a single sermon', async () => {
    const noReferenceAudio = { ...AUDIO, book: null, chapter: null, verse: null }
    const singleSermonPlaylist: PlaylistData = {
      ...PLAYLIST,
      sections: [{ itemsSize: 'middle', title: SECTION_TITLE, transform: 'short' }],
      sermons: [AUDIO],
    }

    const { getByText, queryByText } = await renderMiniPlayer({
      audio: noReferenceAudio,
      playlist: singleSermonPlaylist,
    })

    expect(getByText(SECTION_TITLE)).toBeTruthy()
    expect(queryByText(PLAYLIST.title)).toBeNull()
  })

  test('pressing the mini player calls the expand callback', async () => {
    const { getByRole } = await renderMiniPlayer()

    await fireEvent.press(getByRole('button', { name: new RegExp(AUDIO.title) }))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  test('keeps the row accessible as a button on native', async () => {
    const { getByRole } = await renderMiniPlayer()

    // The row keeps the button role on native (web switches to link so the inner
    // play/pause button is not nested inside another <button>).
    expect(getByRole('button', { name: new RegExp(AUDIO.title) })).toBeTruthy()
  })

  test('pressing the play/pause button calls onPlayPause', async () => {
    const { getByRole } = await renderMiniPlayer()

    await fireEvent.press(getByRole('button', { name: PLAY_LABEL }))

    expect(mockOnPlayPause).toHaveBeenCalledTimes(1)
  })

  test('keeps the transport control inside the same visual box as the artwork', async () => {
    const { getByRole } = await renderMiniPlayer()

    const playButton = getByRole('button', { name: PLAY_LABEL })

    expect(StyleSheet.flatten(playButton.props.style)).toMatchObject({
      height: MINI_PLAY_BOX_SIZE,
      width: MINI_PLAY_BOX_SIZE,
    })
    expect(playButton.props.hitSlop).toBe(MINI_PLAY_HIT_SLOP)
  })

  test('shows the play icon when paused and the pause icon when playing', async () => {
    const paused = await renderMiniPlayer({ playing: false })
    expect(paused.getByRole('button', { name: PLAY_LABEL })).toBeTruthy()

    const playing = await renderMiniPlayer({ playing: true })
    expect(playing.getByRole('button', { name: PAUSE_LABEL })).toBeTruthy()
  })

  test('gates the buffering spinner on showSpinner', async () => {
    const buffering = await renderMiniPlayer({ showSpinner: true })
    expect(buffering.getByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeTruthy()
    expect(
      buffering.queryByRole('button', { name: new RegExp(`${PLAY_LABEL}|${PAUSE_LABEL}`) }),
    ).toBeNull()

    const ready = await renderMiniPlayer({ showSpinner: false })
    expect(ready.queryByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeNull()
    expect(ready.getByRole('button', { name: PLAY_LABEL })).toBeTruthy()
  })

  test('keeps the spinner while buffering even when playing', async () => {
    const { getByTestId, queryByRole } = await renderMiniPlayer({
      playing: true,
      showSpinner: true,
    })

    expect(getByTestId(BUFFERING_INDICATOR_TEST_ID)).toBeTruthy()
    expect(queryByRole('button', { name: new RegExp(`${PLAY_LABEL}|${PAUSE_LABEL}`) })).toBeNull()
  })

  test('registers the play/pause onboarding target while the pause step is active', async () => {
    const measureSpy = mockMeasureInWindow({ height: 4, width: 3, x: 1, y: 2 })
    const ctx = createCtx()
    onboardingTourAtom(ctx, { deckIndex: 2, scenarioId: 'player', skippedDeckIndexes: [] })

    await renderWithProviders(<MiniPlayer {...baseProps} />, { ctx })

    await waitFor(() =>
      expect(
        Object.values(ctx.get(onboardingTargetRectsAtom)['player.mini-play-pause'] ?? {}),
      ).toEqual([{ height: 4, width: 3, x: 1, y: 2 }]),
    )

    measureSpy.mockRestore()
  })
})
