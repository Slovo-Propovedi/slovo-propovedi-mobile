import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import {
  FAVORITES_PLAYLIST,
  type LocalPlaylistData,
  myPlaylistsAtom,
  sectionSettingsAtom,
} from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// The section fires loadMyPlaylists/loadSectionSettings on mount; a real storage
// read would clobber the atom seeded per test. Replace them with no-op reatom
// actions so tests own the atom.
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
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

const PLAYLIST_A_TITLE = 'Плейлист A'
const PLAYLIST_B_TITLE = 'Плейлист B'
const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const SECTION_TITLE = 'Мои плейлисты'
const FAVORITES_TITLE = FAVORITES_PLAYLIST.title

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

describe('<MyPlaylistsSlider>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the favorites card first and the local playlists', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText, getByLabelText, getByText } = await renderWithProviders(
      <MyPlaylistsSlider />,
      { ctx },
    )

    expect(getByLabelText(SECTION_TITLE)).toBeTruthy()
    expect(getByText('heart')).toBeTruthy()
    expect(getAllByText(FAVORITES_TITLE)[0]).toBeTruthy()
    expect(getAllByText(PLAYLIST_A_TITLE)[0]).toBeTruthy()
    expect(getAllByText(PLAYLIST_B_TITLE)[0]).toBeTruthy()
  })

  test('has no edit affordances on the slider', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { queryByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })

    expect(queryByLabelText(EDIT_LABEL)).toBeNull()
    expect(queryByLabelText(SAVE_LABEL)).toBeNull()
  })

  test('navigates to the my-playlists screen when the title is pressed', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getByLabelText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })

    fireEvent.press(getByLabelText(SECTION_TITLE))

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/listen/my-playlists' }),
    )
  })

  test('navigates to the playlist on a card tap', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })

    fireEvent.press(getAllByText(PLAYLIST_A_TITLE)[0])

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { playlist: 'a' } }))
  })

  test('navigates to the favorites playlist on the heart card tap', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByText } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })

    fireEvent.press(getAllByText(FAVORITES_TITLE)[0])

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: { playlist: FAVORITES_PLAYLIST.id } }),
    )
  })

  test('renders the under-slide description for the default title location', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)

    const { getAllByTestId } = await renderWithProviders(<MyPlaylistsSlider />, { ctx })

    expect(getAllByTestId('slider-item-description-under-slide').length).toBeGreaterThan(0)
  })

  test('maps the configured title location to the on-slide description', async () => {
    const ctx = createCtx()
    seedPlaylists(ctx)
    sectionSettingsAtom(ctx, {
      borderRadius: false,
      isDescriptionTitleOnSlideLarge: false,
      itemsRows: null,
      itemsSize: 'small',
      transform: 'middle',
      whereIsSlideTitleLocated: 'on',
    })

    const { getAllByTestId, queryAllByTestId } = await renderWithProviders(<MyPlaylistsSlider />, {
      ctx,
    })

    expect(getAllByTestId('slider-item-description-on-slide').length).toBeGreaterThan(0)
    expect(queryAllByTestId('slider-item-description-under-slide')).toHaveLength(0)
  })
})
