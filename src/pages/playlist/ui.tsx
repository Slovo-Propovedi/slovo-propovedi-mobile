import React from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { useAudio, usePlayerStore } from 'pages';
import { Playlist } from 'widgets';
import { SermonData } from 'entities';
import { COLORS, FONT_SIZES, INDENTS, OnPressTouchableListItem, TouchableListItem } from 'shared';

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route: {
    params: { title, list, previewUrl, description },
    params: playlist,
  },
  navigation: { navigate },
}) => {
  const { setCurrentPlaylist, setCurrentAudio, setCurrentSound, currentAudio } = usePlayerStore(
    ({ setCurrentPlaylist, setCurrentAudio, setCurrentSound, currentAudio }) => ({
      setCurrentPlaylist,
      setCurrentAudio,
      setCurrentSound,
      currentAudio,
    }),
  );

  const { play, getPlaybackStatus, recreateSound } = useAudio();

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
      newSound = await recreateSound(newAudio);
    }

    newSound && setCurrentSound(newSound);
    await play(newSound);
    await getPlaybackStatus(newSound);
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
