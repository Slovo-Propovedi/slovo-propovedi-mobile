import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { Playlist } from 'widgets';
import { OnPressPlaylistItem, PlaylistItem } from 'features';
import { COLORS, FONT_SIZES, INDENTS } from 'shared';

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route,
  navigation: { navigate },
}) => {
  const { title, list, previewUrl, description } = route.params;

  const onPressPlaylistItem: OnPressPlaylistItem = (sermon) => {
    console.log('onPressPlaylistItem: ');
    navigate;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Playlist
        style={styles.content}
        title={title}
        previewUrl={previewUrl}
        description={description}
      >
        {list.map((sermon, index) => (
          <PlaylistItem
            key={`TouchableItem-${index}`}
            index={index}
            sermon={sermon}
            onPressPlaylistItem={onPressPlaylistItem}
          />
        ))}
      </Playlist>
    </SafeAreaView>
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
