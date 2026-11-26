import { createCtx, type Ctx } from '@reatom/framework'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { type TestInstance } from 'test-renderer'
import { isPlayerExpandedAtom } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { DarkTheme, LightTheme, useTheme } from 'shared/ui/theme'
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
const RECT = { height: 36, width: 36, x: 100, y: 200 }
// Widths exercised below follow MINI_WIDE_CONTROL_HIDE_WIDTHS (text 960,
// menu 920, queue 880, repeat 856, favorite 832, previous 808, next 784).
const WIDEST = 1024
const TEXT_HIDDEN = 930
const MENU_HIDDEN = 900
const CLUSTER_RIGHT = 860
const NEXT_ONLY = 790
const PLAY_ONLY = 780

let mockWindowWidth = WIDEST

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: mockWindowWidth }),
}))

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
  // The open action is the observable "expand first" event: it flips the sheet
  // atom synchronously, so the details/sound-settings atoms can be checked to
  // arrive after it.
  const mockIsPlayerExpandedAtom = atom(false, 'mockIsPlayerExpandedAtom')

  return {
    closePlayerSheetAction: action(
      (ctx: Ctx) => mockIsPlayerExpandedAtom(ctx, false),
      'mockClosePlayerSheet',
    ),
    isPlayerExpandedAtom: mockIsPlayerExpandedAtom,
    openPlayerSheetAction: action(
      (ctx: Ctx) => mockIsPlayerExpandedAtom(ctx, true),
      'mockOpenPlayerSheet',
    ),
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
      findIndexByLabel(TEXT_SERMON_LABEL),
      findIndexByLabel(MENU_LABEL),
      findIndexByLabel(OPEN_PLAYLIST_LABEL),
    ])
  })

  test('keeps the transport cluster after the title once the menu cluster is gone', async () => {
    mockWindowWidth = CLUSTER_RIGHT
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

  describe('progressive hiding on narrower wide layouts', () => {
    test('drops only the text-sermon placeholder below its threshold', async () => {
      mockWindowWidth = TEXT_HIDDEN
      const { getByLabelText, getByTestId, queryByLabelText } = await renderRow()

      expect(queryByLabelText(TEXT_SERMON_LABEL)).toBeNull()
      expect(getByLabelText(MENU_LABEL)).toBeTruthy()
      expect(getByLabelText(OPEN_PLAYLIST_LABEL)).toBeTruthy()
      expect(getByTestId(TRANSPORT_CLUSTER_TEST_ID)).not.toHaveStyle({ marginLeft: 'auto' })
    })

    test('drops the ⋮ menu next, keeping the cluster on the left', async () => {
      mockWindowWidth = MENU_HIDDEN
      const { getByLabelText, queryByLabelText } = await renderRow()

      expect(queryByLabelText(TEXT_SERMON_LABEL)).toBeNull()
      expect(queryByLabelText(MENU_LABEL)).toBeNull()
      expect(getByLabelText(OPEN_PLAYLIST_LABEL)).toBeTruthy()
      expect(getByLabelText(REPEAT_OFF_LABEL)).toBeTruthy()
    })

    test('drops the whole right cluster and right-aligns the transport', async () => {
      mockWindowWidth = CLUSTER_RIGHT
      const { getByLabelText, getByTestId, queryByLabelText } = await renderRow()

      expect(queryByLabelText(TEXT_SERMON_LABEL)).toBeNull()
      expect(queryByLabelText(MENU_LABEL)).toBeNull()
      expect(queryByLabelText(OPEN_PLAYLIST_LABEL)).toBeNull()
      expect(getByLabelText(REPEAT_OFF_LABEL)).toBeTruthy()
      expect(getByLabelText(PREV_LABEL)).toBeTruthy()
      expect(getByLabelText(PLAY_LABEL)).toBeTruthy()
      expect(getByLabelText(NEXT_LABEL)).toBeTruthy()
      expect(getByLabelText(ADD_TO_FAVORITES_LABEL)).toBeTruthy()
      expect(getByTestId(TRANSPORT_CLUSTER_TEST_ID)).toHaveStyle({ marginLeft: 'auto' })
    })

    test('keeps only next and play once repeat, favorite and prev are gone', async () => {
      mockWindowWidth = NEXT_ONLY
      const { getByLabelText, queryByLabelText } = await renderRow()

      expect(queryByLabelText(REPEAT_OFF_LABEL)).toBeNull()
      expect(queryByLabelText(ADD_TO_FAVORITES_LABEL)).toBeNull()
      expect(queryByLabelText(PREV_LABEL)).toBeNull()
      expect(getByLabelText(NEXT_LABEL)).toBeTruthy()
      expect(getByLabelText(PLAY_LABEL)).toBeTruthy()
    })

    test('leaves the bare artwork/title/play row above the phone breakpoint', async () => {
      mockWindowWidth = PLAY_ONLY
      const { getByLabelText, queryByLabelText } = await renderRow()

      expect(queryByLabelText(REPEAT_OFF_LABEL)).toBeNull()
      expect(queryByLabelText(ADD_TO_FAVORITES_LABEL)).toBeNull()
      expect(queryByLabelText(PREV_LABEL)).toBeNull()
      expect(queryByLabelText(NEXT_LABEL)).toBeNull()
      expect(getByLabelText(PLAY_LABEL)).toBeTruthy()
    })
  })
})
