import { createCtx } from '@reatom/framework'
import { act, fireEvent, userEvent, waitFor, within } from '@testing-library/react-native'
import { FAVORITES_PLAYLIST, type LocalPlaylistData, myPlaylistsAtom } from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// The section fires loadMyPlaylists on mount; a real storage read would clobber
// the atom seeded per test. Replace it with a no-op reatom action so tests own
// the atom while the real reorder action still runs.
jest.mock('entities/playlist', () => {
  const { action } = jest.requireActual('@reatom/framework')

  return {
    ...jest.requireActual('entities/playlist'),
    loadMyPlaylists: action(() => Promise.resolve([]), 'loadMyPlaylistsMock'),
  }
})

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

type DragEndHandler = (info: { data: LocalPlaylistData[] }) => void

// DraggableFlatList is a pure-JS reanimated list; a FlatList passthrough keeps
// the card rendering under test without dragging internals, while capturing the
// real `onDragEnd` the drag list passes so a reorder can be simulated.
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

const PLAYLIST_A_TITLE = 'Плейлист A'
const PLAYLIST_B_TITLE = 'Плейлист B'
const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const FAVORITES_TITLE = FAVORITES_PLAYLIST.title

const PLAYLIST_A: LocalPlaylistData = { id: 'a', sermonIds: [], title: PLAYLIST_A_TITLE }
const PLAYLIST_B: LocalPlaylistData = { id: 'b', sermonIds: [], title: PLAYLIST_B_TITLE }

const seedPlaylists = (ctx: ReturnType<typeof createCtx>) =>
  myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, PLAYLIST_A, PLAYLIST_B])

const orderedIds = (ctx: ReturnType<typeof createCtx>) =>
  ctx.get(myPlaylistsAtom).map(playlist => playlist.id)

describe('<MyPlaylistsSlider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCapturedOnDragEnd = null
  })

  test('renders the favorites card first', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByTestId, getByLabelText, getByText } = await renderWithProviders(
      <MyPlaylistsSlider />,
      { ctx },
    )

    expect(getByLabelText('Мои плейлисты')).toBeTruthy()
    expect(getByText('heart')).toBeTruthy()
    // One description node per card: favorites is pinned standalone and must not
    // be rendered a second time by the drag list (which holds only the rest).
    const cards = getAllByTestId('slider-item-description-under-slide')
    const favoritesCards = cards.filter(card => {
      const query = within(card)
      return query.queryAllByText(FAVORITES_TITLE).length > 0
    })
    expect(favoritesCards).toHaveLength(1)
  })

  test('shows the edit action and navigates on a card tap in normal mode', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText, getByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, {
      ctx,
    })

    expect(getByLabelText(EDIT_LABEL)).toBeTruthy()

    fireEvent.press(getAllByText(PLAYLIST_A_TITLE)[0])

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { playlist: 'a' } }))
  })

  test('enters edit mode: shows save and stops card navigation', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText, getByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, {
      ctx,
    })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))

    expect(getByLabelText(SAVE_LABEL)).toBeTruthy()
    // Pencil stays available so edit mode can be left without saving.
    expect(getByLabelText(EDIT_LABEL)).toBeTruthy()

    fireEvent.press(getAllByText(PLAYLIST_A_TITLE)[0])
    fireEvent.press(getAllByText(FAVORITES_TITLE)[0])
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('commits the local order once on save', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })
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

    const { getByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })
    const user = userEvent.setup()

    await user.press(getByLabelText(EDIT_LABEL))
    await act(async () => {
      mockCapturedOnDragEnd?.({ data: [PLAYLIST_B, PLAYLIST_A] })
    })
    await user.press(getByLabelText(EDIT_LABEL))

    expect(orderedIds(ctx)).toEqual(['favorites', 'a', 'b'])
  })
})
