import { Audio } from 'expo-av';
// eslint-disable-next-line import/no-internal-modules
import { Sound } from 'expo-av/build/Audio';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useScrollAudio } from '../hooks';
import { PlayerControlButton } from './control-button';

interface PlayerControlButtonBackwardProps {
  position: number;
  duration: number;
  changeValue: number;
  size: number;
  pause: (newSound?: Audio.Sound) => Promise<void>;
  changeProgressPosition: (value: number, newSound?: Audio.Sound) => Promise<void>;
  play: (newSound?: Sound | undefined) => Promise<void>;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControlButtonBackward = ({
  position,
  duration,
  changeValue,
  size,
  pause,
  changeProgressPosition,
  play,
  style,
}: PlayerControlButtonBackwardProps) => {
  const { scrollAudio, scrollAudioOnInterval, clearRewindInterval } = useScrollAudio({
    position,
    duration,
    changeValue,
    pause,
    changeProgressPosition,
  });

  const switchTrackBackward = async () => {
    await scrollAudio({ dir: 'backward' });
  };

  const rewindAudio = async () => {
    await scrollAudioOnInterval('backward');
  };

  const onPressOutAudioTwistButton = async () => {
    await play();

    clearRewindInterval();
  };

  return (
    <PlayerControlButton
      style={style}
      testID='backward-button'
      onPress={switchTrackBackward}
      onLongPress={rewindAudio}
      onPressOut={onPressOutAudioTwistButton}
      type='backward'
      size={size}
      isDisabled={position <= 0}
    />
  );
};
