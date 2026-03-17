import { render } from '@testing-library/react-native'
import { PlayerControls } from './PlayerControls'
import '@testing-library/jest-native/extend-expect'

jest.mock('../lib/PlayerService', () => ({
  playerService: {
    getState: jest.fn(() => ({
      duration: 0,
      isBuffering: false,
      isPlaying: false,
      position: 0,
    })),
    loadAudio: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    seekTo: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    unload: jest.fn(),
  },
}))

const currentPlaylist = {
  id: '1',
  list: [
    {
      audioUrl: 'https://test.com/audio1.mp3',
      description: 'Description 1',
      id: '1',
      title: 'Title 1',
    },
    {
      audioUrl: 'https://test.com/audio2.mp3',
      description: 'Description 2',
      id: '2',
      title: 'Title 2',
    },
    {
      audioUrl: 'https://test.com/audio3.mp3',
      description: 'Description 3',
      id: '3',
      title: 'Title 3',
    },
  ],
  previewUrl: 'https://test.com/preview1.mp3',
  title: 'Playlist 1',
}

const getMockPlayerControlsProps = () => ({
  currentAudio: currentPlaylist.list[0],
  currentPlaylist,
  setCurrentAudio: jest.fn(),
})

let mockPlayerControlsProps = getMockPlayerControlsProps()

describe('<PlayerControls>', () => {
  beforeEach(() => {
    mockPlayerControlsProps = getMockPlayerControlsProps()
    jest.clearAllMocks()
  })

  test('PlayerControls renders correctly', () => {
    const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />)
    const controlsContainer = getByTestId('controls-container')
    expect(controlsContainer).toBeTruthy()
  })
})
