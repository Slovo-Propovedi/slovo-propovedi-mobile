import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  SermonPlayerControls,
  useSermonPlayerControlsStore,
} from 'features/sermon-player-controls';
import { PlayerListenProgress } from 'entities/player';
import type { ListenStackNavProp, ListenStackScreenProps } from 'shared';
import {
  COLORS,
  FONT_SIZES,
  IMAGE_PLACEHOLDER,
  INDENTS,
  ListenStackParamName,
  SIZE_OF_MINIMUM_SIDE_OF_SCREEN,
  useAppStore,
} from 'shared';

export const AudioPlayerScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.AudioPlayer>
> = () => {
  const { navigate } = useNavigation<ListenStackNavProp<ListenStackParamName.ListenHome>>();

  const { currentAudio, currentPlaylist } = useSermonPlayerControlsStore(state => ({
    currentAudio: state.currentAudio,
    currentPlaylist: state.currentPlaylist,
  }));

  const { setIsAudioPlayerMounted } = useAppStore(state => ({
    setIsAudioPlayerMounted: state.setIsAudioPlayerMounted,
  }));

  const isDisabledShowPlaylistButton = !currentPlaylist || currentPlaylist.list.length < 2;

  const onPressListItem = () => {
    if (!currentPlaylist) return;

    navigate(ListenStackParamName.Playlist, currentPlaylist);
  };

  useEffect(() => {
    setIsAudioPlayerMounted(true);

    return () => {
      setIsAudioPlayerMounted(false);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        alt='Sermon poster'
        imageStyle={styles.previewImage}
        source={{ uri: currentAudio?.previewUrl || IMAGE_PLACEHOLDER }}
        style={styles.preview}
      >
        {!currentAudio && <Text style={{ fontSize: FONT_SIZES.h1 }}>Проповедь не выбрана</Text>}
      </ImageBackground>

      <View style={styles.bottomContent}>
        <Text style={styles.title}>{currentAudio?.title || 'Проповедь не выбрана'}</Text>

        <PlayerListenProgress />

        <SermonPlayerControls style={styles.controlsContainer} />

        {/* <PlayerSoundVolume /> */}
        <View style={styles.mediaButtons}>
          <View />
          <View />
          <TouchableOpacity disabled={isDisabledShowPlaylistButton} onPress={onPressListItem}>
            <Feather
              color={isDisabledShowPlaylistButton ? COLORS.disabled : COLORS.black}
              name='list'
              size={35}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const previewSize = SIZE_OF_MINIMUM_SIDE_OF_SCREEN - INDENTS.high * 2;

const styles = StyleSheet.create({
  bottomContent: {
    bottom: 0,
    position: 'absolute',
  },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: INDENTS.high },

  controlsContainer: {
    marginVertical: INDENTS.high,
  },
  mediaButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: INDENTS.high,
    width: '100%',
  },

  preview: {
    alignItems: 'center',
    height: previewSize * 1.2,
    justifyContent: 'center',

    marginTop: -(previewSize / 2),
    width: previewSize,
  },

  previewImage: { borderRadius: 20, height: '100%', width: '100%' },

  title: {
    fontSize: FONT_SIZES.h3,
    marginVertical: INDENTS.high,
  },
});
