import { createCtx, type Ctx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { isPlayerExpandedAtom } from 'entities/player'
import { type AudioPlayerData } from 'entities/sermon'
import { mockMeasureInWindow } from 'shared/mocks/measure'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showDetailsAtom } from '../../model/showDetailsAtom'
import { showSoundSettingsAtom } from '../../model/showSoundSettingsAtom'
import { MiniPlayerControlsRow } from './MiniPlayerControlsRow'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const TEXT_SERMON_LABEL = 'Текст проповеди'
const MENU_LABEL = 'Меню плеера'
const DETAILS_LABEL = 'Подробнее'
const SOUND_SETTINGS_LABEL = 'Настройки звука'
const REPEAT_OFF_LABEL = 'Повтор: выключен'
const PREV_LABEL = 'Предыдущая проповедь'
const NEXT_LABEL = 'Следующая проповедь'
const PLAY_LABEL = 'Воспроизвести'
const DROPDOWN_TEST_ID = 'anchored-dropdown'
const RECT = { height: 36, width: 36, x: 100, y: 200 }

const AUDIO: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Проповедь',
}

const mockToggleFavorite = jest.fn()
const mockUseFavoriteSermon = jest.fn()
const mockSnapshotMembership = jest.fn()
const mockDropdownProps = jest.fn()
const mockPlayerMenuProps = jest.fn()

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
    PlayerControlsSize: { Small: 20 },
    PlayerRepeatToggle: () => (
      <Pressable accessibilityRole='button' accessibilityLabel='Повтор: выключен'>
        <Text>repeat</Text>
      </Pressable>
    ),
    SermonPlayerControls: () => (
      <>
        <PlayerControlButton type={PlayerControlButtonType.Prev} />
        <PlayerControlButton type={PlayerControlButtonType.Play} />
        <PlayerControlButton type={PlayerControlButtonType.Next} />
      </>
    ),
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

const renderRow = (ctx = createCtx()) =>
  renderWithProviders(<MiniPlayerControlsRow audio={AUDIO} />, { ctx })

describe('<MiniPlayerControlsRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  test('omits the queue burger until the sheet task lands', async () => {
    const { queryByLabelText } = await renderRow()

    expect(queryByLabelText('Открыть плейлист')).toBeNull()
  })
})
