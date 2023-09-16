import React, { useRef } from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text } from 'react-native';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { SermonData } from 'entities';
import {
  FONT_SIZES,
  IMAGE_PLACEHOLDER,
  INDENTS,
  PlayerControlButton,
  Progress,
  isNonNullable,
  millisToMinutesAndSeconds,
} from 'shared';
import { useAudio } from './hooks';
import { usePlayerStore } from './model';

const windowWidth = Dimensions.get('window').width;

// Не тестируется также из-за ошибки в библиотеке expo-av

export type AudioPlayerData = Omit<SermonData, 'audioUrl'> & {
  audioUrl: string;
  previewUrl?: string;
};

export const AudioPlayerScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.AudioPlayer>
> = () => {
  const {
    play,
    pause,
    recreateSound,
    getPlaybackStatus,
    changeProgressPosition,
    duration,
    position,
  } = useAudio();

  const { setCurrentAudio, setCurrentSound, currentAudio, currentPlaylist, isPlayingCurrentAudio } =
    usePlayerStore(
      ({
        setCurrentAudio,
        setCurrentSound,
        currentAudio,
        currentPlaylist,
        isPlayingCurrentAudio,
      }) => ({
        setCurrentAudio,
        setCurrentSound,
        currentAudio,
        currentPlaylist,
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

    const newSound = await recreateSound(newAudio);
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
    <View style={styles.container}>
      <ImageBackground
        style={styles.preview}
        imageStyle={styles.previewImage}
        source={{ uri: currentAudio?.previewUrl || IMAGE_PLACEHOLDER }}
        alt='Sermon poster'
      />

      <View style={styles.bottomContent}>
        <Text style={styles.title}>{currentAudio?.title || 'Title'}</Text>

        <Progress total={duration} progress={position} />

        <View style={styles.progressTextsContainer}>
          <Text>{millisToMinutesAndSeconds(position)}</Text>
          <Text>{millisToMinutesAndSeconds(duration)}</Text>
        </View>

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
      </View>
    </View>
  );
};

const previewSize = windowWidth - INDENTS.main * 2;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: INDENTS.main },
  preview: {
    marginTop: -(previewSize / 2),
    width: previewSize,
    height: previewSize * 1.2,
  },

  previewImage: { height: '100%', width: '100%', borderRadius: 20 },

  bottomContent: {
    position: 'absolute',
    bottom: 0,
  },

  title: {
    fontSize: FONT_SIZES.h3,
    marginVertical: INDENTS.main,
  },

  progressTextsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: INDENTS.main,
  },
});
