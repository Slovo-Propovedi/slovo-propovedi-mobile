import { Audio } from 'expo-av';
// eslint-disable-next-line import/no-internal-modules
import { Sound } from 'expo-av/build/Audio';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useScrollAudio } from '../hooks';
import { PlayerControlButton } from './control-button';

interface PlayerControlButtonForwardProps {
  position: number;
  duration: number;
  changeValue: number;
  size: number;
  pause: (newSound?: Audio.Sound) => Promise<void>;
  changeProgressPosition: (value: number, newSound?: Audio.Sound) => Promise<void>;
  play: (newSound?: Sound | undefined) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControlButtonForward = ({
  position,
  duration,
  changeValue,
  size,
  pause,
  changeProgressPosition,
  play,
  style,
}: PlayerControlButtonForwardProps) => {
  const { scrollAudio, scrollAudioOnInterval, clearRewindInterval } = useScrollAudio({
    position,
    duration,
    changeValue,
    pause,
    changeProgressPosition,
  });

  const switchTrackForward = async () => {
    await scrollAudio({ dir: 'forward' });
  };

  const fastForwardAudio = async () => {
    await scrollAudioOnInterval('forward');
  };

  const onPressOutAudioTwistButton = async () => {
    await play();

    clearRewindInterval();
  };

  return (
    <PlayerControlButton
      style={style}
      testID='forward-button'
      onPress={switchTrackForward}
      onLongPress={fastForwardAudio}
      onPressOut={onPressOutAudioTwistButton}
      type='forward'
      size={size}
      isDisabled={position >= duration}
    />
  );
};
