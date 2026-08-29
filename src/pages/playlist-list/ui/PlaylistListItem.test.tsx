import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import type { PlaylistData } from 'shared/model'
import { PlaylistListItem } from './PlaylistListItem'

jest.mock('shared/ui', () => {
  const { Text, View } = jest.requireActual('react-native')

  return {
    CoverImage: () => <View />,
    MarqueeText: ({ text }: { text: string }) => <Text>{text}</Text>,
  }
})

const PLAYLIST_TITLE = 'Плейлист о вере'
const PLAYLIST_DESCRIPTION = 'Описание плейлиста'

const makePlaylist = (overrides: Partial<PlaylistData> = {}): PlaylistData => ({
  artwork: null,
  id: 'playlist-1',
  sermons: [],
  title: PLAYLIST_TITLE,
  ...overrides,
})

describe('<PlaylistListItem>', () => {
  test('renders the playlist title', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem onPress={jest.fn()} playlist={makePlaylist()} />,
    )

    expect(getByText(PLAYLIST_TITLE)).toBeTruthy()
  })

  test('renders the description when present', async () => {
    const { getByText } = await renderWithProviders(
      <PlaylistListItem
        onPress={jest.fn()}
        playlist={makePlaylist({ description: PLAYLIST_DESCRIPTION })}
      />,
    )

    expect(getByText(PLAYLIST_DESCRIPTION)).toBeTruthy()
  })

  test('does not render the description when absent', async () => {
    const { queryByText } = await renderWithProviders(
      <PlaylistListItem onPress={jest.fn()} playlist={makePlaylist()} />,
    )

    expect(queryByText(PLAYLIST_DESCRIPTION)).toBeNull()
  })

  test('fires onPress when the row is pressed', async () => {
    const onPress = jest.fn()
    const { getByText } = await renderWithProviders(
      <PlaylistListItem onPress={onPress} playlist={makePlaylist()} />,
    )

    fireEvent.press(getByText(PLAYLIST_TITLE))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
