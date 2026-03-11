import { render } from '@testing-library/react-native'
import { usePlayer } from '../lib/usePlayer'
import { PlayerControls } from './PlayerControls'
import '@testing-library/jest-native/extend-expect'

jest.mock('../lib/usePlayer', () => ({
  usePlayer: jest.fn(),
}))

let mockedUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>

const getNewMockUsePlayerReturnValue = ({
  durationInitial = 0,
  isPlayingInitial = false,
  positionInitial = 3000,
}: {
  durationInitial?: number
  isPlayingInitial?: boolean
  positionInitial?: number
}) => {
  let position = positionInitial

  return {
    duration: durationInitial,
    isBuffering: false,
    isPlaying: isPlayingInitial,
    loadAudio: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    position,
    seekTo: jest.fn(async (newPos: number) => {
      position = newPos
    }),
    stop: jest.fn(),
    unload: jest.fn(),
  }
}

let mockUsePlayerReturnValue = getNewMockUsePlayerReturnValue({})

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
    mockUsePlayerReturnValue = getNewMockUsePlayerReturnValue({})
    mockPlayerControlsProps = getMockPlayerControlsProps()

    mockedUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>

    mockedUsePlayer.mockReturnValue(mockUsePlayerReturnValue)
  })

  test('PlayerControls renders correctly', () => {
    const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />)
    const controlsContainer = getByTestId('controls-container')
    expect(controlsContainer).toBeTruthy()
  })
})
