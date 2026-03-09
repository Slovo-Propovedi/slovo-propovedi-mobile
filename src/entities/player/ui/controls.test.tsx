import { render } from '@testing-library/react-native'
import { usePlayer } from '../hooks'
import { PlayerControls } from './controls'
import '@testing-library/jest-native/extend-expect'

const changeValue = 15000

jest.mock('../hooks', () => ({
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
    changeProgressPosition: jest.fn(async () => {
      position += changeValue
    }),
    duration: durationInitial,
    isPlaying: isPlayingInitial,
    pause: jest.fn(),
    play: jest.fn(),
    position,
    recreateSound: jest.fn(),
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
    jest.mock('../hooks', () => ({
      usePlayer: jest.fn(),
    }))

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
