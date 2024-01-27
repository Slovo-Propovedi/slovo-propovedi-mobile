import React, { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlayNewSermon } from 'features/sermon-player-controls';
import type {
  ListenStackParamName,
  ListenStackScreenProps,
  OnPressTouchableListItem,
  SermonData,
} from 'shared';
import { COLORS, FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS, TouchableListItem } from 'shared';

const windowHeight = Dimensions.get('window').height;

export const PlaylistScreen: React.FC<ListenStackScreenProps<ListenStackParamName.Playlist>> = ({
  route: {
    params: { description, list, previewUrl, title },
    params: playlist,
  },
}) => {
  const [previewLayout, setPreviewLayout] = useState({ height: 0, width: 0 });

  const playNewSermon = usePlayNewSermon();

  const onPressPlaylistItem: OnPressTouchableListItem<SermonData> = async sermon =>
    await playNewSermon({ playlist, sermon });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setPreviewLayout({ height, width });
  };

  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        onLayout={handleLayout}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
        style={styles.preview}
      >
        <Text style={[styles.title, { marginTop: previewLayout.height / 3 }]}>{title}</Text>

        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>

      <View style={styles.content}>
        {list.map((sermon, index) => (
          <TouchableListItem
            data={sermon}
            key={sermon.id}
            onPress={onPressPlaylistItem}
            previewPlaceholderText={`${index + 1}`}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  content: { padding: INDENTS.middle, paddingRight: 0 },

  description: {
    color: COLORS.white,
    fontSize: FONT_SIZES.h3,
    marginTop: 'auto',
    maxHeight: '20%',
    padding: INDENTS.high,
  },

  preview: {
    height: windowHeight * 0.7,
    width: '100%',
  },

  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingBottom: INDENTS.high,
  },
});
