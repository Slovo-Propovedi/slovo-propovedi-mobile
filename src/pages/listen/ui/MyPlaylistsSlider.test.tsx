import { createCtx } from '@reatom/framework'
import { FAVORITES_PLAYLIST, myPlaylistsAtom } from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { MyPlaylistsSlider } from './MyPlaylistsSlider'

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    Entypo: (props: { name: string }) => <Text>{props.name}</Text>,
    Ionicons: (props: { name: string }) => <Text>{props.name}</Text>,
  }
})

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// DraggableFlatList is a pure-JS reanimated list; a FlatList passthrough keeps
// the card rendering under test without dragging internals.
jest.mock('react-native-draggable-flatlist', () => {
  const { FlatList } = jest.requireActual('react-native')

  return { __esModule: true, default: FlatList }
})

describe('<MyPlaylistsSlider>', () => {
  test('renders the favorites card first', async () => {
    const ctx = createCtx()
    myPlaylistsAtom(ctx, [FAVORITES_PLAYLIST, { id: 'a', sermonIds: [], title: 'Плейлист A' }])

    const { getAllByText, getByLabelText, getByText } = await renderWithProviders(
      <MyPlaylistsSlider />,
      { ctx },
    )

    expect(getByLabelText('Мои плейлисты')).toBeTruthy()
    expect(getByText('heart')).toBeTruthy()
    expect(getAllByText(FAVORITES_PLAYLIST.title).length).toBeGreaterThan(0)
  })
})
