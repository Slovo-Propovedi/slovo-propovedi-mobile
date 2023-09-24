import { Audio } from 'expo-av';
// eslint-disable-next-line import/no-internal-modules
import { Sound } from 'expo-av/build/Audio';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PlayerControlButton } from './control-button';

interface PlayerControlButtonPlayProps {
  size: number;
  isPlayingCurrentAudio: boolean;
  pause: (newSound?: Audio.Sound) => Promise<void>;
  play: (newSound?: Sound | undefined) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControlButtonPlay = ({
  size,
  isPlayingCurrentAudio,
  pause,
  play,
  style,
}: PlayerControlButtonPlayProps) => {
  const togglePlay = async () => {
    if (isPlayingCurrentAudio) {
      return await pause();
    }

    return await play();
  };

  return (
    <PlayerControlButton
      style={style}
      testID='play-button'
      onPress={togglePlay}
      type={isPlayingCurrentAudio ? 'pause' : 'play'}
      size={size}
    />
  );
};
