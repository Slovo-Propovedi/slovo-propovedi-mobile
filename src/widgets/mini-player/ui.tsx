import { useNavigation } from '@react-navigation/native';
import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  SermonPlayerControls,
  useSermonPlayerControlsStore,
} from 'features/sermon-player-controls';
import { PlayerControlsSize } from 'entities/player';
import type { ListenStackNavProp } from 'shared';
import { FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS, ListenStackParamName, RADIUSES } from 'shared';

export const MiniPlayer = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { currentAudio, currentPlaylist } = useSermonPlayerControlsStore((state) => ({
    currentAudio: state.currentAudio,
    currentPlaylist: state.currentPlaylist,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigate(ListenStackParamName.AudioPlayer)}
        style={styles.touchableElements}
      >
        <Image
          alt='Sermon poster'
          source={{ uri: currentAudio?.previewUrl || IMAGE_PLACEHOLDER }}
          style={styles.preview}
        />

        <View style={styles.titles}>
          <Text numberOfLines={1} style={styles.audioTitle}>
            {currentAudio?.title || 'Проповедь не выбрана'}
          </Text>
          {currentAudio && currentPlaylist && currentAudio.title !== currentPlaylist.title && (
            <Text numberOfLines={1} style={styles.playlistTitle}>
              {currentPlaylist.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.controlsContainer}>
        <SermonPlayerControls
          excludeButtons={['backward', 'prev', 'prev', 'forward']}
          size={PlayerControlsSize.Small}
          style={styles.controls}
        />
      </View>
    </View>
  );
};

const titleGeneralStyle: StyleProp<TextStyle> = {
  flexWrap: 'wrap',
  maxWidth: '100%',
  overflow: 'hidden',
};

const styles = StyleSheet.create({
  audioTitle: {
    fontSize: FONT_SIZES.h3,
    ...titleGeneralStyle,
  },
  container: {
    flexDirection: 'row',
    padding: INDENTS.low,
  },
  controls: {
    width: 'auto',
  },
  controlsContainer: {
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  playlistTitle: {
    ...titleGeneralStyle,
  },
  preview: {
    borderRadius: RADIUSES.low,
    height: 50,
    width: 50,
  },
  titles: {
    flex: 1,
    flexWrap: 'wrap',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: INDENTS.low,
  },
  touchableElements: {
    flex: 1,
    flexDirection: 'row',
  },
});
