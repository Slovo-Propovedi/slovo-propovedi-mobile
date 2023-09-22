import React from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { Playlist } from 'widgets';
import { useManagingSermonPlayerStore } from 'features/managing-sermon-player';
import { usePlayer, usePlayerStore } from 'entities/player';
import { SermonData } from 'entities/sermon';
import { COLORS, FONT_SIZES, INDENTS, OnPressTouchableListItem, TouchableListItem } from 'shared';

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route: {
    params: { title, list, previewUrl, description },
    params: playlist,
  },
  navigation: { navigate },
}) => {
  const { play, getPlaybackStatus, recreateSound } = usePlayer();

  const { setCurrentPlaylist, setCurrentAudio, currentAudio } = useManagingSermonPlayerStore(
    ({ setCurrentPlaylist, setCurrentAudio, currentAudio }) => ({
      setCurrentPlaylist,
      setCurrentAudio,
      currentAudio,
    }),
  );
  const { setCurrentSound } = usePlayerStore(({ setCurrentSound }) => ({
    setCurrentSound,
  }));

  const onPressPlaylistItem: OnPressTouchableListItem<SermonData> = async ({
    audioUrl,
    id,
    ...other
  }) => {
    if (!audioUrl) {
      return;
    }

    const newAudio = { ...other, id, audioUrl, previewUrl };

    setCurrentAudio(newAudio);
    setCurrentPlaylist(playlist);

    navigate(ListenStackParamName.AudioPlayer);

    let newSound;

    if (currentAudio?.id !== id) {
      newSound = await recreateSound(newAudio.audioUrl);
    }

    newSound && setCurrentSound(newSound);
    await getPlaybackStatus(newSound);
    await play(newSound);
  };

  return (
    <Playlist
      style={styles.content}
      title={title}
      previewUrl={previewUrl}
      description={description}
    >
      {list.map((sermon, index) => (
        <TouchableListItem
          key={`TouchableItem-${index}`}
          previewPlaceholderText={`${index + 1}`}
          data={sermon}
          onPress={onPressPlaylistItem}
        />
      ))}
    </Playlist>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.main,
  },
  list: { paddingLeft: INDENTS.main },
});
