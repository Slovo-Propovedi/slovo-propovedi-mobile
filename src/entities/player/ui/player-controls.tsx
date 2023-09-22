import React, { useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { PlaylistData } from 'widgets';
import { usePlayer, usePlayerStore } from 'entities/player';
import { SermonData } from 'entities/sermon';
import { PlayerControlButton, isNonNullable } from 'shared';

// Не тестируется также из-за ошибки в библиотеке expo-av

export type AudioPlayerData = Omit<SermonData, 'audioUrl'> & {
  audioUrl: string;
  previewUrl?: string;
};

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  setCurrentAudio: (audio: AudioPlayerData) => void;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  setCurrentAudio,
}: PlayerControlsProps) => {
  const { play, pause, recreateSound, getPlaybackStatus, changeProgressPosition, position } =
    usePlayer();

  const { setCurrentSound, isPlayingCurrentAudio } = usePlayerStore(
    ({ setCurrentSound, isPlayingCurrentAudio }) => ({
      setCurrentSound,
      isPlayingCurrentAudio,
    }),
  );

  const rewindTimerRef = useRef<NodeJS.Timeout | null>(null);

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const changeValue = 15000;

  const audioTwistDelay = 300;

  const size = 35;

  const togglePlay = async () => {
    if (isPlayingCurrentAudio) {
      return await pause();
    }

    return await play();
  };

  const switchTrackForward = async () => {
    await changeProgressPosition(position + changeValue);
  };
  const switchTrackBackward = async () => {
    await changeProgressPosition(position - changeValue);
  };

  const clearRewindInterval = () => {
    rewindTimerRef.current && clearInterval(rewindTimerRef.current);
  };

  const audioTwist = async (dir: 'next' | 'prev') => {
    let updatedPosition = position;

    await pause();

    rewindTimerRef.current = setInterval(() => {
      if (dir === 'next') {
        updatedPosition += changeValue;
      } else {
        updatedPosition -= changeValue;
      }

      changeProgressPosition(updatedPosition);
    }, audioTwistDelay);
  };

  const fastForwardAudio = async () => {
    await audioTwist('next');
  };

  const rewindAudio = async () => {
    await audioTwist('prev');
  };

  const toggleTrack = async (dir: 'next' | 'prev') => {
    if (!isNonNullable(indexOfCurrentAudioInPlaylist) || !currentPlaylist) {
      return;
    }

    const { audioUrl, ...otherProps } =
      currentPlaylist.list[
        dir === 'next' ? indexOfCurrentAudioInPlaylist + 1 : indexOfCurrentAudioInPlaylist - 1
      ];

    if (!audioUrl) {
      return;
    }

    const newAudio = { ...otherProps, audioUrl, previewUrl: currentPlaylist.previewUrl };

    setCurrentAudio(newAudio);

    const newSound = await recreateSound(newAudio.audioUrl);
    newSound && setCurrentSound(newSound);

    await play(newSound);
    await getPlaybackStatus(newSound);
  };

  const switchToNextTrack = async () => {
    await toggleTrack('next');
  };

  const switchToPreviousTrack = async () => {
    await toggleTrack('prev');
  };

  const onPressOutAudioTwistButton = async () => {
    await play();

    clearRewindInterval();
  };

  return (
    <View style={styles.controlsContainer}>
      <PlayerControlButton
        onPress={switchToPreviousTrack}
        type='prev'
        size={size}
        isDisabled={indexOfCurrentAudioInPlaylist === 0}
      />
      <PlayerControlButton
        onPress={switchTrackBackward}
        onLongPress={rewindAudio}
        onPressOut={onPressOutAudioTwistButton}
        type='backward'
        size={size}
      />
      <PlayerControlButton
        onPress={togglePlay}
        type={isPlayingCurrentAudio ? 'pause' : 'play'}
        size={size * 2}
      />
      <PlayerControlButton
        onPress={switchTrackForward}
        onLongPress={fastForwardAudio}
        onPressOut={onPressOutAudioTwistButton}
        type='forward'
        size={size}
      />
      <PlayerControlButton
        onPress={switchToNextTrack}
        type='next'
        size={size}
        isDisabled={
          currentPlaylist && indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
});
