import { fireEvent, screen } from '@testing-library/react-native'
import { type ReactElement } from 'react'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { SearchPreacherRow } from './SearchPreacherRow'

let mockTrackProps: null | Record<string, unknown> = null

jest.mock('entities/track-list', () => {
  const { Pressable, Text } = jest.requireActual('react-native')

  return {
    TRACK_LIST_ITEM_SIZES: jest.requireActual('entities/track-list').TRACK_LIST_ITEM_SIZES,
    TracksListItem: (props: {
      onPress: () => void
      renderMenuButton?: (button: ReactElement) => ReactElement
      title: string
    }) => {
      mockTrackProps = props

      return (
        <Pressable onPress={props.onPress} accessibilityRole='button'>
          <Text>{props.title}</Text>
          {props.renderMenuButton === undefined ? (
            <Text>Меню трека</Text>
          ) : (
            props.renderMenuButton(<Text>MENU</Text>)
          )}
        </Pressable>
      )
    },
  }
})

const ARTIST = 'Иван Иванов'
const TRACK_MENU_LABEL = 'Меню трека'

describe('<SearchPreacherRow>', () => {
  beforeEach(() => {
    mockTrackProps = null
  })

  test('renders the preacher as a track row named after the artist', async () => {
    await renderWithProviders(<SearchPreacherRow artist={ARTIST} onPress={jest.fn()} />)

    expect(screen.getByRole('button', { name: ARTIST })).toBeTruthy()
    expect(mockTrackProps).toMatchObject({ isPlaying: false, title: ARTIST })
    // An artist has no audio, so the row must not forward sermon/audio/menu data.
    expect(mockTrackProps).not.toHaveProperty('audioUrl')
    expect(mockTrackProps).not.toHaveProperty('menuActions')
    expect(mockTrackProps).not.toHaveProperty('sermon')
    // No dead ⋯ trigger: the row has nothing to act on.
    expect(screen.queryByText(TRACK_MENU_LABEL)).toBeNull()
  })

  test('opens the preacher on press', async () => {
    const onPress = jest.fn()
    await renderWithProviders(<SearchPreacherRow artist={ARTIST} onPress={onPress} />)

    fireEvent.press(screen.getByRole('button', { name: ARTIST }))

    expect(onPress).toHaveBeenCalledWith(ARTIST)
  })
})
