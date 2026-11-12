import { createCtx } from '@reatom/framework'
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { type ComponentProps, type ComponentRef, createRef } from 'react'
import { Platform, StyleSheet, type TextStyle, type View } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import { onboardingTargetRectsAtom, onboardingTourAtom } from 'features/onboarding'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { BlurTargetProvider, getGlassBorder, getGlassFill, GLASS } from 'shared/ui'
import {
  BOTTOM_CHROME_SHADE_KEY,
  registerBlurTarget,
  unregisterBlurTarget,
} from 'shared/ui/glass/blurTargets'
import { DarkTheme, FONT_SIZES, LightTheme } from 'shared/ui/theme'
import { MiniPlayer } from './MiniPlayer'
import {
  createMiniStyles,
  MINI_ARTWORK_SIZE,
  MINI_CONTENT_SIDE_INSET,
  MINI_EXPANDED_TRANSPORT_RIGHT_INSET,
  MINI_PLAY_HIT_SLOP,
} from './miniStyles'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn() }),
  usePathname: () => '/listen',
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
// The row is exposed by its accessible name, which includes the track title.
const TITLE_NAME_PATTERN = new RegExp(AUDIO.title)

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
  barCollapsed: false,
  currentTheme: LightTheme,
  isLight: true,
  miniBarRestingStyle: {},
  miniBarStyle: {},
  miniPan: {} as GestureType,
  miniStyle: {},
  miniStyles: createMiniStyles(LightTheme),
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
    // The pill itself carries no shadow: the shared `BarBackdropShade` gradient
    // sits behind the whole bar complex.
    expect(
      screen.root?.queryAll(
        instance => StyleSheet.flatten(instance.props.style)?.boxShadow !== undefined,
      ),
    ).toHaveLength(0)
  })

  test('drops its own shadow while tucked under the search row', async () => {
    const { getByRole } = await renderMiniPlayer({ isTucked: true })

    const row = getByRole('button', { name: TITLE_NAME_PATTERN })

    // Nothing of the tucked pill may bleed a shadow around the search pill/✕.
    expect(StyleSheet.flatten(row.props.style)).toMatchObject({
      boxShadow: 'none',
      elevation: 0,
    })
  })

  test('does not paint a solid background over the pill glass', async () => {
    // The pill itself must stay background-free; any opaque fill here (or in the
    // layers below it) hides the BlurView backdrop and the pill reads as solid.
    const { getByRole } = await renderMiniPlayer()

    const pill = getByRole('button', { name: TITLE_NAME_PATTERN })

    expect(StyleSheet.flatten(pill.props.style)?.backgroundColor).toBeUndefined()
  })

  test('uses the dark glass recipe in the dark theme', async () => {
    await renderMiniPlayer({
      currentTheme: DarkTheme,
      isLight: false,
      miniStyles: createMiniStyles(DarkTheme),
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

  test('frosts the page, never the chrome shade, while the search page is open', async () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' })
    Object.defineProperty(Platform, 'Version', { configurable: true, value: 35 })
    const pageTarget = createRef<ComponentRef<typeof View>>()
    const shadeTarget = createRef<ComponentRef<typeof View>>()
    await act(async () => {
      registerBlurTarget('/listen', pageTarget)
      registerBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
    })

    try {
      await renderWithProviders(<MiniPlayer {...baseProps} />, {
        AdditionalWrapper: BlurTargetProvider,
      })

      const blur = screen.root?.queryAll(
        instance => instance.props.intensity === GLASS.blur.intensity,
      )[0]

      // The pill floats over the page, not over the tab-bar shade: sampling the
      // shade would frost it with the gray gradient while the page behind it is
      // black (the bright-gray slab in the dark theme).
      expect(blur?.props.blurTarget).toBe(pageTarget)
    } finally {
      await act(async () => {
        unregisterBlurTarget('/listen', pageTarget)
        unregisterBlurTarget(BOTTOM_CHROME_SHADE_KEY, shadeTarget)
      })
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' })
      Object.defineProperty(Platform, 'Version', { configurable: true, value: undefined })
    }
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

  test('gives the title and subtitle one font size and color, with weight only on the title', async () => {
    await renderMiniPlayer()

    const titleStyle = StyleSheet.flatten(
      capturedMovingTextProps.find(props => props.text === AUDIO.title)?.style as TextStyle,
    )
    const subtitleStyle = StyleSheet.flatten(
      capturedMovingTextProps.find(props => props.text === REFERENCE_TEXT)?.style as TextStyle,
    )

    expect(titleStyle?.fontSize).toBe(subtitleStyle?.fontSize)
    // One step above body text on the theme scale: at arm's length on a phone the
    // 14dp pill read smaller than Apple Music's mini text (≈17dp).
    expect(titleStyle?.fontSize).toBe(FONT_SIZES.md)
    // Apple Music reads the two lines as one block: only the weight separates
    // them, so the subtitle must not drop to the muted color.
    expect(subtitleStyle?.color).toBe(titleStyle?.color)
    expect(titleStyle?.color).toBe(LightTheme.text)
    expect(titleStyle?.fontWeight).toBe('600')
    expect(subtitleStyle?.fontWeight).toBe('400')
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

    await fireEvent.press(getByRole('button', { name: TITLE_NAME_PATTERN }))

    expect(mockOnPress).toHaveBeenCalledTimes(1)
  })

  test('keeps the row accessible as a button on native', async () => {
    const { getByRole } = await renderMiniPlayer()

    // The row keeps the button role on native (web switches to link so the inner
    // play/pause button is not nested inside another <button>).
    expect(getByRole('button', { name: TITLE_NAME_PATTERN })).toBeTruthy()
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
      height: MINI_ARTWORK_SIZE,
      width: MINI_ARTWORK_SIZE,
    })
    expect(playButton.props.hitSlop).toBe(MINI_PLAY_HIT_SLOP)
  })

  test('expanded bar: the transport sits on the search circle axis', async () => {
    const { getByRole } = await renderMiniPlayer({ barCollapsed: false })

    const row = getByRole('button', { name: TITLE_NAME_PATTERN })

    // The pill spans the row content, so its right edge coincides with the
    // search circle's right edge: a 18dp right inset centres the 40dp transport
    // box on the 76dp circle's axis (38 − 20).
    expect(StyleSheet.flatten(row.props.style)).toMatchObject({
      paddingLeft: MINI_CONTENT_SIDE_INSET,
      paddingRight: MINI_EXPANDED_TRANSPORT_RIGHT_INSET,
    })
  })

  test('collapsed bar: the right gap mirrors the artwork gap', async () => {
    const { getByRole } = await renderMiniPlayer({ barCollapsed: true })

    const row = getByRole('button', { name: TITLE_NAME_PATTERN })

    expect(StyleSheet.flatten(row.props.style)).toMatchObject({
      paddingLeft: MINI_CONTENT_SIDE_INSET,
      paddingRight: MINI_CONTENT_SIDE_INSET,
    })
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
