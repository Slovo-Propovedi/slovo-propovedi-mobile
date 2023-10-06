import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, Text } from 'react-native';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import {
  SermonPlayerControls,
  useSermonPlayerControlsStore,
} from 'features/sermon-player-controls';
import { PlayerListenProgress } from 'entities/player';
import { FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS, useAppStore } from 'shared';

const windowWidth = Dimensions.get('window').width;

export const AudioPlayerScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.AudioPlayer>
> = () => {
  const { currentAudio } = useSermonPlayerControlsStore((state) => ({
    currentAudio: state.currentAudio,
  }));

  const { setIsAudioPlayerMounted } = useAppStore((state) => ({
    setIsAudioPlayerMounted: state.setIsAudioPlayerMounted,
  }));

  useEffect(() => {
    setIsAudioPlayerMounted(true);

    return () => {
      setIsAudioPlayerMounted(false);
    };
  }, []);

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

        <SermonPlayerControls style={styles.controlsContainer} />
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
