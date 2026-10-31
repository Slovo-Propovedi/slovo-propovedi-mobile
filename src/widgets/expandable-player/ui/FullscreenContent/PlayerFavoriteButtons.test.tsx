import { fireEvent } from '@testing-library/react-native'
import { type AudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type createStyles } from '../ExpandablePlayer/styles'
import { PlayerFavoriteButtons } from './PlayerFavoriteButtons'

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn() }),
}))

const mockToggleFavorite = jest.fn()
const mockOnAddToPlaylist = jest.fn()
const mockUseFavoriteSermon = jest.fn()

jest.mock('entities/playlist', () => ({
  useFavoriteSermon: () => mockUseFavoriteSermon(),
}))

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const ADD_TO_PLAYLIST_BUTTON_LABEL = 'Добавить в плейлист'

const MOCK_AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Sermon',
}

const STYLES = {
  menuButton: {},
  menuIcon: {},
} as unknown as ReturnType<typeof createStyles>

const Harness = () => (
  <PlayerFavoriteButtons styles={STYLES} audio={MOCK_AUDIO} onAddToPlaylist={mockOnAddToPlaylist} />
)

describe('<PlayerFavoriteButtons>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFavoriteSermon.mockReturnValue({ isFavorite: false, toggleFavorite: mockToggleFavorite })
  })

  test('toggles favorites from the heart button', async () => {
    const { getByLabelText } = await renderWithProviders(<Harness />)

    fireEvent.press(getByLabelText(ADD_TO_FAVORITES_LABEL))

    expect(mockToggleFavorite).toHaveBeenCalledTimes(1)
  })

  test('shows the remove label when the sermon is already a favorite', async () => {
    mockUseFavoriteSermon.mockReturnValue({ isFavorite: true, toggleFavorite: mockToggleFavorite })

    const { getByLabelText } = await renderWithProviders(<Harness />)

    expect(getByLabelText(REMOVE_FROM_FAVORITES_LABEL)).toBeTruthy()
  })

  test('adds the current sermon to a playlist from the plus button', async () => {
    const { getByLabelText } = await renderWithProviders(<Harness />)

    fireEvent.press(getByLabelText(ADD_TO_PLAYLIST_BUTTON_LABEL))

    expect(mockOnAddToPlaylist).toHaveBeenCalledWith(MOCK_AUDIO)
  })
})
