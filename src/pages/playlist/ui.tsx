import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SermonsStackScreenProps, SermonsStackParamName } from 'routing';
import { Playlist } from 'widgets';
import { OnPressPlaylistItem, PlaylistItem } from 'features';
import { COLORS, FONT_SIZES, INDENTS } from 'shared';

export const PlaylistScreen: React.FC<SermonsStackScreenProps<SermonsStackParamName.Playlist>> = ({
  route,
  navigation: { navigate },
}) => {
  const { title, list, previewUrl, description } = route.params;

  const getOnPressPlaylistItem: OnPressPlaylistItem = (sermon) => {
    console.log('sermon: ', sermon);
  };

  return (
    <Playlist
      style={styles.container}
      title={title}
      previewUrl={previewUrl}
      description={description}
    >
      {list.map((sermon, index) => (
        <PlaylistItem
          key={`TouchableItem-${index}`}
          index={index}
          sermon={sermon}
          onPressPlaylistItem={getOnPressPlaylistItem}
        />
      ))}
    </Playlist>
  );
};

const styles = StyleSheet.create({
  container: {},
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.main,
  },
  list: { paddingLeft: INDENTS.main },
});
