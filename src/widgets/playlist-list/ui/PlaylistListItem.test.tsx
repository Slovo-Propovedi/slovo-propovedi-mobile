import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { getListItemCardArtworkSize } from 'entities/list-item'
import { renderWithProviders } from 'shared/mocks'
import { type PlaylistListItemData } from '../model'
import { PlaylistListItem } from './PlaylistListItem'

const mockLetterAvatar = jest.fn()

jest.mock('shared/ui', () => {
  const { View } = jest.requireActual('react-native')

  return {
    CoverImage: () => <View />,
    PlaylistLetterAvatar: (props: { size: number; title: string }) => {
      mockLetterAvatar(props)
      return <View />
    },
  }
})

const PLAYLIST_TITLE = 'Плейлист о вере'
const PLAYLIST_SUBTITLE = 'Описание плейлиста'
const PLAYLIST_ARTWORK = 'https://example.test/cover.jpg'
const ARTWORK_NODE_TEXT = 'маркер'
const LONG_PLAYLIST_TITLE = 'Очень длинное название плейлиста '.repeat(5)

const makeItem = (overrides: Partial<PlaylistListItemData> = {}): PlaylistListItemData => ({
  artwork: null,
  id: 'playlist-1',
  title: PLAYLIST_TITLE,
  ...overrides,
})

describe('<PlaylistListItem>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the playlist title', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem item={makeItem()} onPress={jest.fn()} />,
    )

    expect(getByText(PLAYLIST_TITLE)).toBeTruthy()
  })

  test('renders a long multiline title fully', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem onPress={jest.fn()} item={makeItem({ title: LONG_PLAYLIST_TITLE })} />,
    )

    expect(getByText(LONG_PLAYLIST_TITLE)).toBeTruthy()
  })

  test('renders the subtitle when present', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem onPress={jest.fn()} item={makeItem({ subtitle: PLAYLIST_SUBTITLE })} />,
    )

    expect(getByText(PLAYLIST_SUBTITLE)).toBeTruthy()
  })

  test('does not render the subtitle when absent', async () => {
    const { queryByText } = await renderWithProviders(
      <PlaylistListItem item={makeItem()} onPress={jest.fn()} />,
    )

    expect(queryByText(PLAYLIST_SUBTITLE)).toBeNull()
  })

  test('renders the letter tile at the standard artwork size when artwork is absent', async () => {
    await renderWithProviders(<PlaylistListItem item={makeItem()} onPress={jest.fn()} />)

    expect(mockLetterAvatar).toHaveBeenCalledWith({
      size: getListItemCardArtworkSize(),
      title: PLAYLIST_TITLE,
    })
  })

  test('does not render the letter tile when artwork is present', async () => {
    await renderWithProviders(
      <PlaylistListItem onPress={jest.fn()} item={makeItem({ artwork: PLAYLIST_ARTWORK })} />,
    )

    expect(mockLetterAvatar).not.toHaveBeenCalled()
  })

  test('prefers artworkNode over the fallback letter tile', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem
        onPress={jest.fn()}
        item={makeItem({ artworkNode: <Text>{ARTWORK_NODE_TEXT}</Text> })}
      />,
    )

    expect(getByText(ARTWORK_NODE_TEXT)).toBeTruthy()
    expect(mockLetterAvatar).not.toHaveBeenCalled()
  })

  test('fires onPress when the row is pressed', async () => {
    const onPress = jest.fn()
    const { getByText } = await renderWithProviders(
      <PlaylistListItem item={makeItem()} onPress={onPress} />,
    )

    fireEvent.press(getByText(PLAYLIST_TITLE))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
