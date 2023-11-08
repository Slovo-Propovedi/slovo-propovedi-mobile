import { Dimensions } from 'react-native';
const { height: windowHeight, width: windowWidth } = Dimensions.get('window');

export const CURRENT_SOUND_POSITION = 'currentSoundPosition';
export const CURRENT_SOUND_DURATION = 'currentSoundDuration';
export const CURRENT_AUDIO = 'currentAudio';
export const CURRENT_PLAYLIST = 'currentPlaylist';

export const SIZE_OF_MINIMUM_SIDE_OF_SCREEN =
  windowWidth > windowHeight ? windowHeight : windowWidth;
