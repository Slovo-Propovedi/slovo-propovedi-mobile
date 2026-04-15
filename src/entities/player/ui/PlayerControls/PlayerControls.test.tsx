import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { render } from '@testing-library/react-native'
import { PlayerControls } from './PlayerControls'
import '@testing-library/jest-native/extend-expect'

const ctx = createCtx()

jest.mock('../../lib/PlayerService', () => ({
  playerService: {
    getState: jest.fn(() => ({
      duration: 0,
      isBuffering: false,
      isPlaying: false,
      position: 0,
    })),
    loadAudio: jest.fn(),
    onTrackEnd: undefined,
    pause: jest.fn(),
    play: jest.fn(),
    seekTo: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    unload: jest.fn(),
  },
}))

const currentPlaylist = {
  artwork: 'https://test.com/preview1.mp3',
  id: '1',
  sermons: [
    {
      artist: 'Test Artist',
      artwork: 'https://test.com/preview1.mp3',
      audioUrl: 'https://test.com/audio1.mp3',
      description: 'Description 1',
      id: '1',
      title: 'Title 1',
    },
    {
      artist: 'Test Artist',
      artwork: 'https://test.com/preview1.mp3',
      audioUrl: 'https://test.com/audio2.mp3',
      description: 'Description 2',
      id: '2',
      title: 'Title 2',
    },
    {
      artist: 'Test Artist',
      artwork: 'https://test.com/preview1.mp3',
      audioUrl: 'https://test.com/audio3.mp3',
      description: 'Description 3',
      id: '3',
      title: 'Title 3',
    },
  ],
  title: 'Playlist 1',
}

const getMockPlayerControlsProps = () => ({
  currentAudio: currentPlaylist.sermons[0],
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
    const { getByTestId } = render(
      <reatomContext.Provider value={ctx}>
        <PlayerControls {...mockPlayerControlsProps} />
      </reatomContext.Provider>,
    )
    const controlsContainer = getByTestId('controls-container')
    expect(controlsContainer).toBeTruthy()
  })
})
