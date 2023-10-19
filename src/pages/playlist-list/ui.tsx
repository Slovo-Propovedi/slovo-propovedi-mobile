import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ListenStackScreenProps, OnPressTouchableListItem, PlaylistData } from 'shared';
import { COLORS, FONT_SIZES, INDENTS, ListenStackParamName, TouchableListItem } from 'shared';

export const PlaylistListScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.PlaylistList>
> = ({
  navigation: { navigate },
  route: {
    params: { playlists, title },
  },
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
            data={playlist}
            key={`TouchableItem-${index}`}
            onPress={onPressListItem}
            previewPlaceholderText={`${index + 1}`}
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
  list: { paddingLeft: INDENTS.main },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.main,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.main,
  },
});
