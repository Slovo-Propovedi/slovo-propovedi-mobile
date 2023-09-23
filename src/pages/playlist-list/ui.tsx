import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { PlaylistData } from 'entities/playlist';
import { COLORS, FONT_SIZES, INDENTS, OnPressTouchableListItem, TouchableListItem } from 'shared';

export const PlaylistListScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.PlaylistList>
> = ({
  route: {
    params: { playlists, title },
  },
  navigation: { navigate },
}) => {
  const { top } = useSafeAreaInsets();

  const onPressListItem: OnPressTouchableListItem<PlaylistData> = (params) => {
    navigate(ListenStackParamName.Playlist, params);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {playlists.map((playlist, index) => (
          <TouchableListItem
            key={`TouchableItem-${index}`}
            previewPlaceholderText={`${index + 1}`}
            data={playlist}
            onPress={onPressListItem}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingBottom: INDENTS.main,
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.main,
  },
  list: { paddingLeft: INDENTS.main },
});
