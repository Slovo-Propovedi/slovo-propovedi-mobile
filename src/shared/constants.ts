import { Dimensions } from 'react-native'

export const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window')

export const CURRENT_SOUND_POSITION = 'currentSoundPosition'
export const CURRENT_SOUND_DURATION = 'currentSoundDuration'
export const CURRENT_AUDIO = 'currentAudio'
export const CURRENT_PLAYLIST = 'currentPlaylist'

export const SIZE_OF_MINIMUM_SIDE_OF_SCREEN =
  SCREEN_WIDTH > SCREEN_HEIGHT ? SCREEN_HEIGHT : SCREEN_WIDTH
