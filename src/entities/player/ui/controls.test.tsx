import { render } from '@testing-library/react-native';
import { usePlayer } from '../hooks';
import { usePlayerStore } from '../model';
import { PlayerControls } from './controls';
import '@testing-library/jest-native/extend-expect';

const changeValue = 15000;

jest.mock('../hooks', () => ({
  usePlayer: jest.fn(),
}));

jest.mock('../model', () => ({
  usePlayerStore: jest.fn(),
}));

let mockedUsePlayerStore = usePlayerStore as jest.MockedFunction<typeof usePlayerStore>;
let mockedUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>;

const getNewMockUsePlayerReturnValue = ({
  isPlayingInitial = false,
  positionInitial = 3000,
  durationInitial = 0,
}: {
  isPlayingInitial?: boolean;
  positionInitial?: number;
  durationInitial?: number;
}) => {
  let position = positionInitial;

  return {
    isPlaying: isPlayingInitial,
    play: jest.fn(),
    pause: jest.fn(),
    position,
    stop: jest.fn(),
    unload: jest.fn(),
    // Как и предполагал - не сработало
    // TODO доделать правильно
    changeProgressPosition: jest.fn(async () => {
      position += changeValue;
    }),
    recreateSound: jest.fn(),
    getPlaybackStatus: jest.fn(),
    duration: durationInitial,
  };
};

const getNewMockUsePlayerStoreValue = () => ({
  isPlayingCurrentAudio: false,
  setCurrentAudio: jest.fn(),
  goToNextTrack: jest.fn(),
});

let mockUsePlayerReturnValue = getNewMockUsePlayerReturnValue({});

let mockUsePlayerStoreValue = getNewMockUsePlayerStoreValue();

const currentPlaylist = {
  id: '1',
  title: 'Playlist 1',
  previewUrl: 'https://test.com/preview1.mp3',
  list: [
    {
      id: '1',
      title: 'Title 1',
      description: 'Description 1',
      audioUrl: 'https://test.com/audio1.mp3',
    },
    {
      id: '2',
      title: 'Title 2',
      description: 'Description 2',
      audioUrl: 'https://test.com/audio2.mp3',
    },
    {
      id: '3',
      title: 'Title 3',
      description: 'Description 3',
      audioUrl: 'https://test.com/audio3.mp3',
    },
  ],
};

const getMockPlayerControlsProps = () => ({
  currentAudio: currentPlaylist.list[0],
  currentPlaylist,
  setCurrentAudio: jest.fn(),
});

let mockPlayerControlsProps = getMockPlayerControlsProps();

describe('<PlayerControls>', () => {
  beforeEach(() => {
    jest.mock('../hooks', () => ({
      usePlayer: jest.fn(),
    }));

    jest.mock('../model', () => ({
      usePlayerStore: jest.fn(),
    }));

    mockUsePlayerReturnValue = getNewMockUsePlayerReturnValue({});
    mockUsePlayerStoreValue = getNewMockUsePlayerStoreValue();
    mockPlayerControlsProps = getMockPlayerControlsProps();

    mockedUsePlayerStore = usePlayerStore as jest.MockedFunction<typeof usePlayerStore>;
    mockedUsePlayer = usePlayer as jest.MockedFunction<typeof usePlayer>;

    mockedUsePlayer.mockReturnValue(mockUsePlayerReturnValue);
    mockedUsePlayerStore.mockReturnValue(mockUsePlayerStoreValue);
  });

  test('PlayerControls renders correctly', () => {
    const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />);
    const controlsContainer = getByTestId('controls-container');
    expect(controlsContainer).toBeTruthy();
  });

  // TODO Переделать тесты по-нормальному

  // test('togglePlay function works correctly', () => {
  //   const { play, pause, isPlaying } = mockUsePlayerReturnValue;

  //   const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />);
  //   const playButton = getByTestId('play-button');

  //   //Simulating pressing the button
  //   fireEvent.press(playButton);

  //   if (isPlaying) {
  //     expect(pause).toHaveBeenCalled();
  //   } else {
  //     expect(play).toHaveBeenCalled();
  //   }
  // });

  // test('switchTrackForward function works correctly', () => {
  //   const { changeProgressPosition, position } = getNewMockUsePlayerReturnValue({
  //     positionInitial: 0,
  //   });

  //   const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />);
  //   const forwardButton = getByTestId('forward-button');

  //   //Simulating pressing the button
  //   fireEvent.press(forwardButton);

  //   expect(changeProgressPosition).toHaveBeenCalledWith(position + changeValue);
  // });

  // test('switchTrackBackward function works correctly', () => {
  //   const { changeProgressPosition, position } = mockUsePlayerReturnValue;

  //   const { getByTestId } = render(<PlayerControls {...mockPlayerControlsProps} />);
  //   const backwardButton = getByTestId('backward-button');

  //   //Simulating pressing the button
  //   fireEvent.press(backwardButton);

  //   expect(changeProgressPosition).toHaveBeenCalledWith(position - changeValue);
  // });

  // test('switchToNextTrack function works correctly', async () => {
  //   const { setCurrentAudio, goToNextTrack } = mockUsePlayerStoreValue;

  //   const position = 30000;
  //   const duration = 60000;

  //   //Mocking the usePlayer hook
  //   mockedUsePlayer.mockReturnValue({ ...mockUsePlayerReturnValue, position, duration });

  //   const { getByTestId, rerender } = render(<PlayerControls {...mockPlayerControlsProps} />);

  //   const forwardButton = getByTestId('forward-button');

  //   // это действие должно проверяться на странице
  //   // //Simulating user listening to the audio till the end
  //   // await waitFor(() => expect(getByTestId('player-progress-bar')).toHaveProp('value', duration));

  //   //Simulating pressing the forward button
  //   fireEvent.press(forwardButton);

  //   expect(goToNextTrack).toHaveBeenCalled();

  //   //Simulating new audio playback
  //   const newAudio = mockPlayerControlsProps.currentPlaylist.list[1];
  //   setCurrentAudio.mockImplementationOnce(() => newAudio);
  //   rerender(<PlayerControls {...mockPlayerControlsProps} currentAudio={newAudio} />);

  //   // expect(setCurrentAudio).toHaveBeenCalledWith(newAudio);
  //   expect(getByTestId('player-progress-bar')).toHaveProp('value', 0);
  // });

  // test('switchToPreviousTrack function works correctly', async () => {
  //   const position = 30000;
  //   const { setCurrentAudio } = mockUsePlayerStoreValue;

  //   //Mocking the usePlayer hook
  //   mockedUsePlayer.mockReturnValue({ ...mockUsePlayerReturnValue, position });

  //   const { getByTestId, rerender } = render(
  //     <PlayerControls
  //       {...mockPlayerControlsProps}
  //       currentAudio={mockPlayerControlsProps.currentPlaylist.list[1]}
  //     />,
  //   );

  //   const backButton = getByTestId('prev-button');

  //   //Simulating pressing the back button
  //   fireEvent.press(backButton);

  //   //Simulating new audio playback
  //   const newAudio = mockPlayerControlsProps.currentPlaylist.list[0];
  //   setCurrentAudio.mockImplementationOnce(() => newAudio);
  //   rerender(<PlayerControls {...mockPlayerControlsProps} currentAudio={newAudio} />);
  // });
});
