import React from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { Playlist, usePlaySermon } from 'entities/playlist';
import { SermonData } from 'entities/sermon';
import { COLORS, FONT_SIZES, INDENTS, OnPressTouchableListItem, TouchableListItem } from 'shared';

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route: {
    params: { title, list, previewUrl, description },
    params: playlist,
  },
}) => {
  const playSermon = usePlaySermon();

  const onPressPlaylistItem: OnPressTouchableListItem<SermonData> = async (sermon) =>
    await playSermon({ playlist, sermon });

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
