import { createCtx } from '@reatom/framework'
import { act, fireEvent, userEvent, waitFor } from '@testing-library/react-native'
import { LIST_ITEM_CARD_ARTWORK_SIZE } from 'entities/list-item'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  myPlaylistsAtom,
  sectionSettingsAtom,
} from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { INDENTS } from 'shared/ui/theme'
import { MyPlaylistsScreen } from './MyPlaylistsScreen'

const mockPush = jest.fn()

jest.mock('expo-router', () => {
  const React = jest.requireActual('react') as {
    createElement: (type: unknown, props: unknown, ...children: unknown[]) => unknown
    Fragment: unknown
  }

  return {
    // Header actions live in `options.headerRight`; render them so tests can press.
    Stack: {
      Screen: ({ options }: { options?: { headerRight?: () => unknown } }) =>
        options?.headerRight
          ? React.createElement(React.Fragment, null, options.headerRight())
          : null,
    },
    useFocusEffect: (callback: () => (() => void) | void) => {
      const { useEffect } = jest.requireActual('react') as {
        useEffect: (effect: () => (() => void) | void, deps: unknown[]) => void
      }
      useEffect(callback, [callback])
    },
    useNavigation: () => ({ addListener: () => () => {} }),
    usePathname: () => '/my-playlists',
    useRouter: () => ({ push: mockPush }),
  }
})

// The screen fires loadMyPlaylists/loadSectionSettings on mount; a real storage
// read would clobber the atom seeded per test. Replace them with no-op reatom
// actions so tests own the atom while the real reorder/update actions still run.
jest.mock('entities/playlist', () => {
  const { action } = jest.requireActual('@reatom/framework')

  return {
    ...jest.requireActual('entities/playlist'),
    loadMyPlaylists: action(() => Promise.resolve([]), 'loadMyPlaylistsMock'),
    loadSectionSettings: action(() => Promise.resolve(), 'loadSectionSettingsMock'),
  }
})

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

type DragEndHandler = (info: { data: LocalPlaylistData[] }) => void

// DraggableFlatList is a pure-JS reanimated list; a FlatList passthrough keeps
// the row rendering under test without dragging internals, while capturing the
// real `onDragEnd` so a reorder can be simulated.
let mockCapturedOnDragEnd: DragEndHandler | null = null

jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = jest.requireActual('react-native')

  return {
    __esModule: true,
    default: ({ onDragEnd, ...props }: { onDragEnd: DragEndHandler }) => {
      mockCapturedOnDragEnd = onDragEnd
      return <FlatList {...props} />
    },
  }
})

jest.mock('shared/ui/collapsing-navbar-driver', () => ({
  useCollapsingNavbarDriver: jest.fn(() => ({ headerBgOpacity: 0 })),
}))

jest.mock('widgets/playlist-list/lib/useCollapsingHeader', () => ({
  TITLE_TOP_GAP: 80,
  useCollapsingHeader: () => ({
    darkenStart: { value: 0 },
    headerHeight: 100,
    onTitleLayout: jest.fn(),
    scrollHandler: jest.fn(),
    scrollY: { value: 0 },
    titleAppearThreshold: { value: Number.MAX_SAFE_INTEGER },
  }),
}))

const PLAYLIST_A_TITLE = 'Плейлист A'
const PLAYLIST_B_TITLE = 'Плейлист B'
const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const DELETE_LABEL = 'Удалить плейлист'
const DELETE_DIALOG_TITLE = 'Удалить плейлист?'
const DELETE_CONFIRM_TEXT = 'Удалить'
const CREATE_ROW_TEXT = 'Создать плейлист'
const FAVORITES_TITLE = FAVORITES_PLAYLIST.title
const DIVIDER_HEIGHT = 1

// Разделитель списка (`PlaylistListSeparator`) — декоративный `View` высотой 1px
// без текста и роли; рендерер не отдаёт композитные узлы, поэтому считаем его по
// высоте host-элемента (как в `TracksListSkeleton.test.tsx`).

const PLAYLIST_A: LocalPlaylistData = {
  id: 'a',
  sermonIds: [],
  sermons: [],
  title: PLAYLIST_A_TITLE,
}
const PLAYLIST_B: LocalPlaylistData = {
  id: 'b',
  sermonIds: [],
  sermons: [],
  title: PLAYLIST_B_TITLE,
}

const seedPlaylists = (ctx: ReturnType<typeof createCtx>) =>
  myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, PLAYLIST_A, PLAYLIST_B])

const orderedIds = (ctx: ReturnType<typeof createCtx>) =>
  ctx.get(myPlaylistsAtom).map(playlist => playlist.id)

describe('<MyPlaylistsScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCapturedOnDragEnd = null
  })

  test('renders favorites first and the local playlists', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    // Favorites is the list header (scrolls with the list), rendered exactly once.
    expect(getByText('heart')).toBeTruthy()
    expect(getAllByText(FAVORITES_TITLE)).toHaveLength(1)
    expect(getByText(PLAYLIST_A_TITLE)).toBeTruthy()
    expect(getByText(PLAYLIST_B_TITLE)).toBeTruthy()
  })

  test('sizes the favorites and create markers like the server playlist artwork', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    const avatarSize = { height: LIST_ITEM_CARD_ARTWORK_SIZE, width: LIST_ITEM_CARD_ARTWORK_SIZE }

    expect(getByText('heart').parent).toHaveStyle(avatarSize)
    expect(getByText('add').parent).toHaveStyle(avatarSize)
  })

  test('shows the edit toggle in the header and reveals save in edit mode', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, queryByLabelText } = await renderWithProviders(<MyPlaylistsScreen />, {
      ctx,
    })
    const user = userEvent.setup()

    expect(getByLabelText(EDIT_LABEL)).toBeTruthy()
    expect(queryByLabelText(SAVE_LABEL)).toBeNull()

    await user.press(getByLabelText(EDIT_LABEL))

    expect(getByLabelText(SAVE_LABEL)).toBeTruthy()
    expect(queryByLabelText(EDIT_LABEL)).toBeNull()
  })

  test('blocks row navigation while editing and restores it after leaving edit mode', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText, getByLabelText } = await renderWithProviders(<MyPlaylistsScreen />, {
      ctx,
    })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    fireEvent.press(getAllByText(PLAYLIST_A_TITLE)[0])
    expect(mockPush).not.toHaveBeenCalled()

    await user.press(getByLabelText(SAVE_LABEL))
    fireEvent.press(getAllByText(PLAYLIST_A_TITLE)[0])
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { playlist: 'a' } }))
  })

  test('navigates on a favorites row tap', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    fireEvent.press(getByText(FAVORITES_TITLE))

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: { playlist: FAVORITES_PLAYLIST.id } }),
    )
  })

  test('blocks favorites navigation while editing', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    fireEvent.press(getByText(FAVORITES_TITLE))

    expect(mockPush).not.toHaveBeenCalled()
  })

  test('commits the local order once on save, favorites first', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    await act(async () => {
      mockCapturedOnDragEnd?.({ data: [PLAYLIST_B, PLAYLIST_A] })
    })
    await user.press(getByLabelText(SAVE_LABEL))

    await waitFor(() => expect(orderedIds(ctx)).toEqual(['favorites', 'b', 'a']))
  })

  test('discards the local order when leaving edit mode without saving', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, unmount } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    await act(async () => {
      mockCapturedOnDragEnd?.({ data: [PLAYLIST_B, PLAYLIST_A] })
    })
    unmount()

    expect(orderedIds(ctx)).toEqual(['favorites', 'a', 'b'])
  })

  test('shows the edit toggle even when only favorites exist', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST])

    const { getByLabelText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    expect(getByLabelText(EDIT_LABEL)).toBeTruthy()
  })

  test('shows the appearance form and the section heading in edit mode', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))

    expect(getByText('Оформление')).toBeTruthy()
    expect(getByText('Плейлисты раздела')).toBeTruthy()
    expect(getByText('Размер карточек')).toBeTruthy()
    expect(getByText('Высота карточек')).toBeTruthy()
    expect(getByText('Расположение заголовка')).toBeTruthy()
    expect(getByText('Строк')).toBeTruthy()
    expect(getByText('Описание на карточке')).toBeTruthy()
    expect(getByText('Скруглённые углы карточек')).toBeTruthy()
  })

  test('persists an appearance change immediately on toggle', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    fireEvent.press(getByText('Скруглённые углы карточек'))

    await waitFor(() => expect(ctx.get(sectionSettingsAtom).borderRadius).toBe(false))
  })

  test('indents drag rows and favorites with the same horizontal inset in edit mode', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { container, getByLabelText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))

    // The single list-content inset lines up the header («Избранные») and rows.
    const lists = container.queryAll(
      node => node.props?.contentContainerStyle?.paddingHorizontal === INDENTS.medium,
    )
    expect(lists.length).toBeGreaterThan(0)

    // The edit header keeps no own horizontal padding — otherwise the favorites
    // row (inside the header) would be indented twice.
    const doubleIndented = container.queryAll(
      node =>
        node.props?.style?.paddingHorizontal === INDENTS.medium &&
        node.props?.style?.paddingTop === INDENTS.medium,
    )
    expect(doubleIndented).toHaveLength(0)
  })

  test('renders a create row and opens the create form on tap', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    expect(getByText(CREATE_ROW_TEXT)).toBeTruthy()

    await act(async () => {
      fireEvent.press(getByText(CREATE_ROW_TEXT))
    })

    expect(getByLabelText('Название')).toBeTruthy()
  })

  test('keeps the create row below the empty playlist list', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [])

    const { getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    expect(getByText('Нет плейлистов')).toBeTruthy()
    expect(getByText(CREATE_ROW_TEXT)).toBeTruthy()
  })

  test('renders a divider before the create row when playlists are present', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { container, getByText } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    // FlatList emits no separator after the last row, so the footer adds one above
    // the create row: 2 dividers between the 3 rows + 1 before «Создать плейлист».
    const dividers = container.queryAll(node => node.props.style?.height === DIVIDER_HEIGHT)

    expect(dividers).toHaveLength(3)
    expect(getByText(CREATE_ROW_TEXT)).toBeTruthy()
  })

  test('does not render a divider when the playlists list is empty', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [])

    const { container } = await renderWithProviders(<MyPlaylistsScreen />, { ctx })

    expect(container.queryAll(node => node.props.style?.height === DIVIDER_HEIGHT)).toHaveLength(0)
  })

  test('deletes a playlist from the edit mode after confirmation', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByLabelText, getByLabelText, getByText, unmount } = await renderWithProviders(
      <MyPlaylistsScreen />,
      { ctx },
    )
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    fireEvent.press(getAllByLabelText(DELETE_LABEL)[0])

    await waitFor(() => expect(getByText(DELETE_DIALOG_TITLE)).toBeTruthy())

    await act(async () => {
      fireEvent.press(getByText(DELETE_CONFIRM_TEXT))
    })

    await waitFor(() => expect(orderedIds(ctx)).toEqual(['favorites', 'b']))
    unmount()
  })

  test('cancels a deletion without removing the playlist', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByLabelText, getByLabelText, getByText, unmount } = await renderWithProviders(
      <MyPlaylistsScreen />,
      { ctx },
    )
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    fireEvent.press(getAllByLabelText(DELETE_LABEL)[0])

    await waitFor(() => expect(getByText('Отмена')).toBeTruthy())

    await act(async () => {
      fireEvent.press(getByText('Отмена'))
    })

    expect(orderedIds(ctx)).toEqual(['favorites', 'a', 'b'])
    unmount()
  })
})
