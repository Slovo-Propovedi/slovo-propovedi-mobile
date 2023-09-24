import { Audio } from 'expo-av';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlaylistData } from 'entities/playlist';
import { useToggleTrack } from '../hooks';
import { PlayerControlButton } from './control-button';
import { AudioPlayerData } from './controls';

interface PlayerControlButtonPrevProps {
  size: number;
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  setCurrentAudio: (audio: AudioPlayerData) => void;
  play: (newSound?: Audio.Sound) => Promise<void>;
  recreateSound: (newAudioUrl: string) => Promise<Audio.Sound>;
  getPlaybackStatus: (newSound?: Audio.Sound) => Promise<
    | {
        durationMillis: number | undefined;
        positionMillis: number;
        isPlaying: boolean;
      }
    | undefined
  >;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControlButtonPrev = ({
  currentAudio,
  currentPlaylist,
  size,
  setCurrentAudio,
  play,
  recreateSound,
  getPlaybackStatus,
  style,
}: PlayerControlButtonPrevProps) => {
  const toggleTrack = useToggleTrack({
    currentAudio,
    currentPlaylist,
    setCurrentAudio,
    play,
    recreateSound,
    getPlaybackStatus,
  });

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const switchToPreviousTrack = async () => {
    await toggleTrack('prev');
  };

  return (
    <PlayerControlButton
      style={style}
      testID='prev-button'
      onPress={switchToPreviousTrack}
      type='prev'
      size={size}
      isDisabled={indexOfCurrentAudioInPlaylist === 0}
    />
  );
};
