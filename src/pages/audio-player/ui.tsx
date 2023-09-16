import React from 'react';
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

  const indexOfCurrentAudioInPlaylist =
    currentAudio && currentPlaylist?.list.findIndex(({ id }) => currentAudio.id === id);

  const { play, pause, recreateSound, getPlaybackStatus, duration, position } = useAudio();

  const size = 35;

  const togglePlay = async () => {
    if (isPlayingCurrentAudio) {
      await pause();
    } else {
      await play();
    }
  };

  const switchTrackForward = () => {
    //
  };
  const switchTrackBackward = () => {
    //
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

  if (!currentAudio) {
    return null;
  }

  const { title, previewUrl } = currentAudio;

  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.preview}
        imageStyle={styles.previewImage}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
        alt='Sermon poster'
      />

      <View style={styles.bottomContent}>
        <Text style={styles.title}>{title}</Text>

        <Progress total={duration} progress={position} />
        <View style={styles.controlsContainer}>
          <PlayerControlButton
            onPress={switchToPreviousTrack}
            type='prev'
            size={size}
            isDisabled={indexOfCurrentAudioInPlaylist === 0}
          />
          <PlayerControlButton onPress={switchTrackBackward} type='backward' size={size} />
          <PlayerControlButton
            onPress={togglePlay}
            type={isPlayingCurrentAudio ? 'pause' : 'play'}
            size={size * 2}
          />
          <PlayerControlButton onPress={switchTrackForward} type='forward' size={size} />
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

  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: INDENTS.main,
  },
});
