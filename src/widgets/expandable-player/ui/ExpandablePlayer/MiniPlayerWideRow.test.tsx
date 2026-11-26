import { createCtx, type Ctx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { type TestInstance } from 'test-renderer'
import { isPlayerExpandedAtom } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { DarkTheme, FONT_SIZES, LightTheme, useTheme } from 'shared/ui/theme'
import { showDetailsAtom } from '../../model/showDetailsAtom'
import { showPlaylistAtom } from '../../model/showPlaylistAtom'
import { showSoundSettingsAtom } from '../../model/showSoundSettingsAtom'
import { MiniPlayerWideRow } from './MiniPlayerWideRow'
import { createMiniStyles } from './miniStyles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const TEXT_SERMON_LABEL = 'Текст проповеди'
const MENU_LABEL = 'Меню плеера'
const OPEN_PLAYLIST_LABEL = 'Открыть плейлист'
const DETAILS_LABEL = 'Подробнее'
const SOUND_SETTINGS_LABEL = 'Настройки звука'
const REPEAT_OFF_LABEL = 'Повтор: выключен'
const PREV_LABEL = 'Предыдущая проповедь'
const NEXT_LABEL = 'Следующая проповедь'
const PLAY_LABEL = 'Воспроизвести'
const DROPDOWN_TEST_ID = 'anchored-dropdown'
const TRANSPORT_CLUSTER_TEST_ID = 'mini-transport-cluster'
const ARTWORK_URL = 'https://example.com/artwork.jpg'
// Icon mock surface: family:name:size. The menu and the text placeholder must use
// the same size as the queue burger, so the cluster reads as one control row.
const MENU_ICON = `MaterialCommunityIcons:dots-horizontal:${FONT_SIZES.xl}`
const VERTICAL_MENU_ICON = `Entypo:dots-three-vertical:${FONT_SIZES.xl}`
const TEXT_ICON = `Ionicons:document-text-outline:${FONT_SIZES.xl}`
const QUEUE_ICON = `Entypo:list:${FONT_SIZES.xl}`
const RECT = { height: 36, width: 36, x: 100, y: 200 }
// Visibility follows the CHROME width (getWideChromeWidth): every window at or
// above the 600pt content column yields the same 550pt chrome, so the full
// toolbar must render across the whole wide range.
const WIDEST = 1024
const WIDE_WINDOW_WIDTHS = [768, 900, 1024, 1440]
// The only way this row reaches the hiding cascade is a window narrower than the
// content column: 557 − 50 = a 507pt chrome, just under the queue threshold.
const NARROW_CHROME_WINDOW = 557

let mockWindowWidth = WIDEST

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: mockWindowWidth }),
}))

// Icon surface for order/size assertions: renders the family, glyph name and the
// size the component passed, so tests can prove horizontal dots and equal sizing.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')
  const createIcon = (family: string) => {
    const MockIcon = ({ name, size }: { name: string; size?: number }) => (
      <Text>{`${family}:${name}:${String(size)}`}</Text>
    )
    MockIcon.displayName = `Mock${family}`
    return MockIcon
  }

  return {
    Entypo: createIcon('Entypo'),
    Ionicons: createIcon('Ionicons'),
    MaterialCommunityIcons: createIcon('MaterialCommunityIcons'),
  }
})

const AUDIO: AudioPlayerData = {
  artist: 'Автор',
  artwork: ARTWORK_URL,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Проповедь',
}

const mockToggleFavorite = jest.fn()
const mockUseFavoriteSermon = jest.fn()
const mockSnapshotMembership = jest.fn()
const mockDropdownProps = jest.fn()
const mockPlayerMenuProps = jest.fn()
const mockRepeatToggleProps = jest.fn()
const mockTransportProps = jest.fn()

// The icon tints of the pill's transport must follow the active theme, exactly
// like the compact pill's play button. Mocking the hook pins the theme instead
// of depending on the test runner's color scheme.
jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')

  return { ...actual, useTheme: jest.fn() }
})

const mockUseTheme = jest.mocked(useTheme)
const DARK_CONTEXT = { currentTheme: DarkTheme, isLight: false, themeMode: 'dark' } as const
const LIGHT_CONTEXT = { currentTheme: LightTheme, isLight: true, themeMode: 'light' } as const

jest.mock('entities/playlist', () => ({
  useFavoriteSermon: () => mockUseFavoriteSermon(),
}))

jest.mock('entities/player', () => {
  const { action, atom } = jest.requireActual('@reatom/framework')
  const { Pressable, Text } = jest.requireActual('react-native')
  const { PlayerControlButton } = jest.requireActual(
    'entities/player/ui/control-button/control-button',
  )
  const { PlayerControlButtonType } = jest.requireActual(
    'entities/player/ui/control-button/control-button.types',
  )
  // The open action mirrors the real one: the sheet atom flips a microtask after
  // the call, so a handler that fire-and-forgets it would show the overlay first.
  const mockIsPlayerExpandedAtom = atom(false, 'mockIsPlayerExpandedAtom')

  return {
    closePlayerSheetAction: action(
      (ctx: Ctx) => mockIsPlayerExpandedAtom(ctx, false),
      'mockClosePlayerSheet',
    ),
    isPlayerExpandedAtom: mockIsPlayerExpandedAtom,
    openPlayerSheetAction: action(async (ctx: Ctx) => {
      await Promise.resolve()
      mockIsPlayerExpandedAtom(ctx, true)
    }, 'mockOpenPlayerSheet'),
    PlayerControlButtonType,
    PlayerControlsSize: { Small: 20 },
    PlayerRepeatToggle: (props: { inactiveColor?: string }) => {
      mockRepeatToggleProps(props)

      return (
        <Pressable accessibilityRole='button' accessibilityLabel='Повтор: выключен'>
          <Text>repeat</Text>
        </Pressable>
      )
    },
    SermonPlayerControls: ({
      color,
      excludeButtons = [],
    }: {
      color?: string
      excludeButtons?: string[]
    }) => {
      mockTransportProps({ color })

      return (
        <>
          {!excludeButtons.includes(PlayerControlButtonType.Prev) && (
            <PlayerControlButton type={PlayerControlButtonType.Prev} />
          )}
          <PlayerControlButton type={PlayerControlButtonType.Play} />
          {!excludeButtons.includes(PlayerControlButtonType.Next) && (
            <PlayerControlButton type={PlayerControlButtonType.Next} />
          )}
        </>
      )
    },
  }
})

jest.mock('../../model/showDetailsAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return { showDetailsAtom: atom(false, 'mockShowDetailsAtom') }
})

jest.mock('../../model/showSoundSettingsAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return { showSoundSettingsAtom: atom(false, 'mockShowSoundSettingsAtom') }
})

jest.mock('../FullscreenContent/useAudioCacheState', () => ({
  useAudioCacheState: () => ({
    handleToggleCache: jest.fn(),
    isCached: false,
    isQueued: false,
    visualState: 'cloud',
  }),
}))

jest.mock('../FullscreenContent/usePlaylistRemoval', () => ({
  usePlaylistRemoval: () => ({
    canRemoveFromPlaylist: false,
    confirmDialog: null,
    dialog: null,
    requestRemove: jest.fn(),
    snapshotMembership: mockSnapshotMembership,
  }),
}))

jest.mock('../PlayerMenu/PlayerMenu', () => {
  const { Pressable: RNPressable, Text: RNText } = jest.requireActual('react-native')

  return {
    PlayerMenu: (props: {
      onClose: () => void
      onOpenSoundSettings: () => void
      onShowDetails: () => void
      variant?: string
    }) => {
      mockPlayerMenuProps(props)

      return (
        <>
          <RNPressable
            onPress={() => {
              props.onShowDetails()
              props.onClose()
            }}
          >
            <RNText>{DETAILS_LABEL}</RNText>
          </RNPressable>
          <RNPressable
            onPress={() => {
              props.onOpenSoundSettings()
              props.onClose()
            }}
          >
            <RNText>{SOUND_SETTINGS_LABEL}</RNText>
          </RNPressable>
        </>
      )
    },
  }
})

jest.mock('shared/ui/menu', () => {
  const { View: RNView } = jest.requireActual('react-native')

  return {
    AnchoredDropdown: (props: { children: ReactNode; visible: boolean }) => {
      mockDropdownProps(props)

      return props.visible ? <RNView testID={DROPDOWN_TEST_ID}>{props.children}</RNView> : null
    },
  }
})

// The track block draws the marquee through MovingText; a plain Text keeps the
// emitted tree readable so render order can be asserted positionally.
jest.mock('shared/ui', () => {
  const actual = jest.requireActual('shared/ui')
  const { Text } = jest.requireActual('react-native')

  return {
    ...actual,
    MovingText: (props: { text?: string }) => <Text>{props.text}</Text>,
  }
})

const renderRow = (ctx = createCtx()) =>
  renderWithProviders(
    <MiniPlayerWideRow audio={AUDIO} playlist={null} miniStyles={createMiniStyles(LightTheme)} />,
    { ctx },
  )

// Depth-first render order: the row must read in the visual order the user sees.
const findNodeIndex = (predicate: (node: TestInstance) => boolean) =>
  (screen.root?.queryAll(() => true) ?? []).findIndex(predicate)

const findIndexByLabel = (label: string) =>
  findNodeIndex(node => node.props.accessibilityLabel === label)

const findIndexByText = (text: string) => findNodeIndex(node => node.props.children === text)

const findIndexByArtwork = (uri: string) => findNodeIndex(node => node.props.source?.uri === uri)

const expectAscending = (positions: number[]) => {
  expect(positions).not.toContain(-1)
  expect(positions).toEqual([...positions].sort((left, right) => left - right))
}

describe('<MiniPlayerWideRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWindowWidth = WIDEST
    mockUseTheme.mockReturnValue(DARK_CONTEXT)
    mockUseFavoriteSermon.mockReturnValue({
      isFavorite: false,
      toggleFavorite: mockToggleFavorite,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders repeat, transport, favorite, text and menu controls', async () => {
    const { getByLabelText, getByRole } = await renderRow()

    expect(getByRole('button', { name: REPEAT_OFF_LABEL })).toBeTruthy()
    expect(getByRole('button', { name: PREV_LABEL })).toBeTruthy()
    expect(getByRole('button', { name: PLAY_LABEL })).toBeTruthy()
    expect(getByRole('button', { name: NEXT_LABEL })).toBeTruthy()
    expect(getByLabelText(ADD_TO_FAVORITES_LABEL)).toBeTruthy()
    expect(getByLabelText(TEXT_SERMON_LABEL)).toBeTruthy()
    expect(getByLabelText(MENU_LABEL)).toBeTruthy()
  })

  test('themes the transport glyphs and the repeat toggle from the dark theme', async () => {
    await renderRow()

    expect(mockTransportProps).toHaveBeenCalledWith(
      expect.objectContaining({ color: DarkTheme.text }),
    )
    expect(mockRepeatToggleProps).toHaveBeenCalledWith(
      expect.objectContaining({ inactiveColor: DarkTheme.text }),
    )
  })

  test('themes the transport glyphs and the repeat toggle from the light theme', async () => {
    mockUseTheme.mockReturnValue(LIGHT_CONTEXT)

    await renderRow()

    expect(mockTransportProps).toHaveBeenCalledWith(
      expect.objectContaining({ color: LightTheme.text }),
    )
    expect(mockRepeatToggleProps).toHaveBeenCalledWith(
      expect.objectContaining({ inactiveColor: LightTheme.text }),
    )
  })

  test('toggles the favorite from the heart button', async () => {
    const { getByLabelText } = await renderRow()

    fireEvent.press(getByLabelText(ADD_TO_FAVORITES_LABEL))

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1)
  })

  test('shows the remove label when the sermon is already a favorite', async () => {
    mockUseFavoriteSermon.mockReturnValue({
      isFavorite: true,
      toggleFavorite: mockToggleFavorite,
    })

    const { getByLabelText } = await renderRow()

    expect(getByLabelText(REMOVE_FROM_FAVORITES_LABEL)).toBeTruthy()
  })

  test('opens the anchored portal with the anchored PlayerMenu on the ⋮ press', async () => {
    mockMeasureInWindow(RECT)
    const { getByLabelText, getByText } = await renderRow()

    expect(mockDropdownProps).toHaveBeenCalledWith(expect.objectContaining({ visible: false }))

    await act(async () => {
      fireEvent.press(getByLabelText(MENU_LABEL))
    })

    expect(mockSnapshotMembership).toHaveBeenCalledTimes(1)
    expect(mockDropdownProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ anchor: RECT, placement: 'above', visible: true }),
    )
    expect(mockPlayerMenuProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ variant: 'anchored' }),
    )
    expect(getByText(DETAILS_LABEL)).toBeTruthy()
  })

  test('hands the ⋯ button ref to the portal so the popover re-measures on resize', async () => {
    mockMeasureInWindow(RECT)
    const { getByLabelText } = await renderRow()

    await act(async () => {
      fireEvent.press(getByLabelText(MENU_LABEL))
    })

    expect(mockDropdownProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        anchorRef: expect.objectContaining({ current: expect.anything() }),
      }),
    )
  })

  test('renders the text button disabled and inert', async () => {
    const { getByLabelText } = await renderRow()

    const textButton = getByLabelText(TEXT_SERMON_LABEL)

    expect(textButton).toBeDisabled()
    fireEvent.press(textButton)
    expect(mockDropdownProps.mock.calls.every(([props]) => props.visible === false)).toBe(true)
  })

  test('details expands the player first, then shows the details sheet', async () => {
    mockMeasureInWindow(RECT)
    const ctx = createCtx()
    const order: string[] = []
    ctx.subscribe(isPlayerExpandedAtom, expanded => {
      if (expanded) order.push('expand')
    })
    ctx.subscribe(showDetailsAtom, shown => {
      if (shown) order.push('details')
    })
    const { getByLabelText, getByText } = await renderRow(ctx)

    await act(async () => {
      fireEvent.press(getByLabelText(MENU_LABEL))
    })
    await act(async () => {
      fireEvent.press(getByText(DETAILS_LABEL))
    })

    expect(order).toEqual(['expand', 'details'])
    expect(ctx.get(isPlayerExpandedAtom)).toBe(true)
    expect(ctx.get(showDetailsAtom)).toBe(true)
  })

  test('sound settings expands the player first, then shows the sound sheet', async () => {
    mockMeasureInWindow(RECT)
    const ctx = createCtx()
    const order: string[] = []
    ctx.subscribe(isPlayerExpandedAtom, expanded => {
      if (expanded) order.push('expand')
    })
    ctx.subscribe(showSoundSettingsAtom, shown => {
      if (shown) order.push('sound-settings')
    })
    const { getByLabelText, getByText } = await renderRow(ctx)

    await act(async () => {
      fireEvent.press(getByLabelText(MENU_LABEL))
    })
    await act(async () => {
      fireEvent.press(getByText(SOUND_SETTINGS_LABEL))
    })

    expect(order).toEqual(['expand', 'sound-settings'])
    expect(ctx.get(isPlayerExpandedAtom)).toBe(true)
    expect(ctx.get(showSoundSettingsAtom)).toBe(true)
  })

  test('renders the queue burger in the wide row', async () => {
    const { getByLabelText } = await renderRow()

    expect(getByLabelText(OPEN_PLAYLIST_LABEL)).toBeTruthy()
  })

  test('opens the queue sheet from the burger without expanding the player', async () => {
    const ctx = createCtx()
    const { getByLabelText } = await renderRow(ctx)

    await act(async () => {
      fireEvent.press(getByLabelText(OPEN_PLAYLIST_LABEL))
    })

    expect(ctx.get(showPlaylistAtom)).toBe(true)
    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
  })

  test('places the transport cluster before the artwork and title on the widest windows', async () => {
    await renderRow()

    expectAscending([
      findIndexByLabel(REPEAT_OFF_LABEL),
      findIndexByLabel(PREV_LABEL),
      findIndexByLabel(PLAY_LABEL),
      findIndexByLabel(NEXT_LABEL),
      findIndexByLabel(ADD_TO_FAVORITES_LABEL),
      findIndexByArtwork(ARTWORK_URL),
      findIndexByText(AUDIO.title),
      findIndexByLabel(MENU_LABEL),
      findIndexByLabel(TEXT_SERMON_LABEL),
      findIndexByLabel(OPEN_PLAYLIST_LABEL),
    ])
  })

  test('draws the wide right cluster as menu, text icon and burger, in that order', async () => {
    await renderRow()

    expectAscending([
      findIndexByArtwork(ARTWORK_URL),
      findIndexByText(AUDIO.title),
      findIndexByText(MENU_ICON),
      findIndexByText(TEXT_ICON),
      findIndexByText(QUEUE_ICON),
    ])
  })

  test('uses horizontal menu dots and a document-text glyph sized like their neighbours', async () => {
    const { getByText, queryByText } = await renderRow()

    expect(getByText(MENU_ICON)).toBeTruthy()
    expect(queryByText(VERTICAL_MENU_ICON)).toBeNull()
    expect(getByText(TEXT_ICON)).toBeTruthy()
    // The same FONT_SIZES.xl size appears in all three icon strings above.
    expect(getByText(QUEUE_ICON)).toBeTruthy()
  })

  test('moves the transport after the title only when the chrome cannot fit the right cluster', async () => {
    mockWindowWidth = NARROW_CHROME_WINDOW
    const { getByTestId, queryByLabelText } = await renderRow()

    expectAscending([
      findIndexByArtwork(ARTWORK_URL),
      findIndexByText(AUDIO.title),
      findIndexByLabel(REPEAT_OFF_LABEL),
      findIndexByLabel(PREV_LABEL),
      findIndexByLabel(PLAY_LABEL),
      findIndexByLabel(NEXT_LABEL),
      findIndexByLabel(ADD_TO_FAVORITES_LABEL),
    ])
    expect(queryByLabelText(TEXT_SERMON_LABEL)).toBeNull()
    expect(queryByLabelText(MENU_LABEL)).toBeNull()
    expect(queryByLabelText(OPEN_PLAYLIST_LABEL)).toBeNull()
    expect(getByTestId(TRANSPORT_CLUSTER_TEST_ID)).toHaveStyle({ marginLeft: 'auto' })
  })

  describe('full toolbar across the wide range', () => {
    test.each(WIDE_WINDOW_WIDTHS)('keeps every control at a %ipt window', async windowWidth => {
      mockWindowWidth = windowWidth
      const { getByLabelText, getByTestId } = await renderRow()

      expect(getByLabelText(TEXT_SERMON_LABEL)).toBeTruthy()
      expect(getByLabelText(MENU_LABEL)).toBeTruthy()
      expect(getByLabelText(OPEN_PLAYLIST_LABEL)).toBeTruthy()
      expect(getByLabelText(REPEAT_OFF_LABEL)).toBeTruthy()
      expect(getByLabelText(ADD_TO_FAVORITES_LABEL)).toBeTruthy()
      expect(getByLabelText(PREV_LABEL)).toBeTruthy()
      expect(getByLabelText(PLAY_LABEL)).toBeTruthy()
      expect(getByLabelText(NEXT_LABEL)).toBeTruthy()
      expect(getByTestId(TRANSPORT_CLUSTER_TEST_ID)).not.toHaveStyle({ marginLeft: 'auto' })
    })
  })
})
