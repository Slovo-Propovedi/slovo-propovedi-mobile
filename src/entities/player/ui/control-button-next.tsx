import { Audio } from 'expo-av';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlaylistData } from 'entities/playlist';
import { useToggleTrack } from '../hooks';
import { PlayerControlButton } from './control-button';
import { AudioPlayerData } from './controls';

interface PlayerControlButtonNextProps {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  size: number;
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

export const PlayerControlButtonNext = ({
  currentAudio,
  currentPlaylist,
  size,
  setCurrentAudio,
  play,
  recreateSound,
  getPlaybackStatus,
  style,
}: PlayerControlButtonNextProps) => {
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

  const switchToNextTrack = async () => {
    await toggleTrack('next');
  };

  return (
    <PlayerControlButton
      style={style}
      onPress={switchToNextTrack}
      type='next'
      size={size}
      isDisabled={
        currentPlaylist && indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1
      }
    />
  );
};
