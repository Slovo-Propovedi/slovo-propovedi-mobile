import React from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text } from 'react-native';
import { SermonData } from 'entities';
import { FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS, PlayerControlButton, Progress } from 'shared';
import { useAudio } from './useAudio';

const windowWidth = Dimensions.get('window').width;

// Не тестируется также из-за ошибки в библиотеке expo-av

export type AudioPlayerData = Omit<SermonData, 'audioUrl'> & {
  audioUrl: string;
  previewUrl?: string;
};

interface AudioPlayerProps {
  data: AudioPlayerData;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  data: { audioUrl, previewUrl, title },
}) => {
  const { play, pause, duration, position, isPlaying } = useAudio({
    audioUrl,
  });

  const size = 35;

  const togglePlay = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

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
          <PlayerControlButton type='prev' size={size} />
          <PlayerControlButton type='backward' size={size} />
          <PlayerControlButton
            onPress={togglePlay}
            type={isPlaying ? 'pause' : 'play'}
            size={size * 2}
          />
          <PlayerControlButton type='forward' size={size} />
          <PlayerControlButton type='next' size={size} />
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
