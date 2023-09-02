import React from 'react';
import { StyleSheet } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { Playlist } from 'widgets';
import { OnPressTouchableListItem, TouchableListItem } from 'features';
import { SermonData } from 'entities';
import { COLORS, FONT_SIZES, INDENTS } from 'shared';

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route,
  navigation: { navigate },
}) => {
  const { title, list, previewUrl, description } = route.params;

  const onPressPlaylistItem: OnPressTouchableListItem<SermonData> = () => {
    console.log('onPressPlaylistItem: ');
    navigate;
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
