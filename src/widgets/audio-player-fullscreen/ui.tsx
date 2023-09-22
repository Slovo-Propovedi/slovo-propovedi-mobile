import React from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text } from 'react-native';
import {
  ManagingSermonPlayer,
  useManagingSermonPlayerStore,
} from 'features/managing-sermon-player';
import { PlayerListenProgress } from 'entities/player';
import { FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS } from 'shared';

const windowWidth = Dimensions.get('window').width;

// Не тестируется также из-за ошибки в библиотеке expo-av

export const AudioPlayerFullscreen = () => {
  const { currentAudio } = useManagingSermonPlayerStore(({ currentAudio }) => ({
    currentAudio,
  }));

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

        <PlayerListenProgress />

        <ManagingSermonPlayer style={styles.controlsContainer} />
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
    marginVertical: INDENTS.main,
  },
});
