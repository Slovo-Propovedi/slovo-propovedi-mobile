import React, { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PlaylistData, SermonData } from 'shared';
import { COLORS, FONT_SIZES, isNonNullable } from 'shared';
import { PlayerControlButton, PlayerControlButtonType } from 'shared';
import { usePlayer } from '../hooks';
import { usePlayerStore } from '../model';
import { schedulePushNotification } from '../utils';

export type AudioPlayerData = Omit<SermonData, 'audioUrl'> & {
  audioUrl: string;
  previewUrl?: string;
};

export enum PlayerControlsSize {
  Large = 35,
  Small = 20,
}

export type ControlsNames =
  | PlayerControlButtonType.Next
  | PlayerControlButtonType.Play
  | PlayerControlButtonType.Prev;

interface PlayerControlsProps {
  currentAudio: AudioPlayerData | null;
  currentPlaylist: PlaylistData | null;
  excludeButtons?: ControlsNames[];
  setCurrentAudio: (audio: AudioPlayerData) => Promise<void>;
  size?: PlayerControlsSize;
  style?: StyleProp<ViewStyle>;
}

export const PlayerControls = ({
  currentAudio,
  currentPlaylist,
  excludeButtons,
  setCurrentAudio,
  size = PlayerControlsSize.Large,
  style,
}: PlayerControlsProps) => {
  const { pause, play, recreateSound } = usePlayer();

  const {
    currentSoundDuration,
    currentSoundPosition,
    isCurrentSoundBuffering,
    isPlayingCurrentAudio,
    setCurrentSound,
  } = usePlayerStore((store) => ({
    currentSoundDuration: store.currentSoundDuration,
    currentSoundPosition: store.currentSoundPosition,
    isCurrentSoundBuffering: store.isCurrentSoundBuffering,
    isPlayingCurrentAudio: store.isPlayingCurrentAudio,
    setCurrentSound: store.setCurrentSound,
  }));

  const {
    next: isNextExcluded,
    play: isPlayExcluded,
    prev: isPrevExcluded,
  } = excludeButtons?.reduce<Partial<Record<ControlsNames, true>>>(
    (acc, currentValue) => ({ ...acc, [currentValue]: true }),
    {},
  ) || {};

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const isNotAvailableNext =
    currentPlaylist && indexOfCurrentAudioInPlaylist === currentPlaylist.list.length - 1;

  const togglePlay = async () => {
    if (isPlayingCurrentAudio) {
      return await pause();
    }

    return await play();
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

    await setCurrentAudio(newAudio);

    const newSound = await recreateSound(newAudio.audioUrl);

    if (newSound) {
      setCurrentSound(newSound);
    }

    await schedulePushNotification({
      body: newAudio.description || '',
      subtitle: currentPlaylist.title || 'Проповедует Андрей Вовк',
      title: newAudio.title,
    });
    await play(newSound);
  };

  const switchToNextTrack = async () => {
    await toggleTrack('next');
  };

  const switchToPreviousTrack = async () => {
    await toggleTrack('prev');
  };

  useEffect(() => {
    if (currentSoundPosition >= currentSoundDuration && !isNotAvailableNext) {
      switchToNextTrack();
    }
  }, [currentSoundDuration, currentSoundPosition, isNotAvailableNext]);

  return (
    <View style={[styles.controlsContainer, style]} testID='controls-container'>
      {!isPrevExcluded && (
        <PlayerControlButton
          isDisabled={indexOfCurrentAudioInPlaylist === 0 || !currentAudio}
          onPress={switchToPreviousTrack}
          size={size}
          testID='prev-button'
          type={PlayerControlButtonType.Prev}
        />
      )}

      {!isPlayExcluded &&
        (isCurrentSoundBuffering ? (
          <View>
            <ActivityIndicator
              color={COLORS.primary}
              size={size * 2 - styles.bufferingText.fontSize}
            />
          </View>
        ) : (
          <PlayerControlButton
            isDisabled={!currentAudio}
            onPress={togglePlay}
            size={size * 2}
            testID='play-button'
            type={
              isPlayingCurrentAudio ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play
            }
          />
        ))}

      {!isNextExcluded && (
        <PlayerControlButton
          isDisabled={isNotAvailableNext || !currentAudio}
          onPress={switchToNextTrack}
          size={size}
          type={PlayerControlButtonType.Next}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bufferingText: {
    alignItems: 'center',
    fontSize: FONT_SIZES.h5,
  },
  controlsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
});
