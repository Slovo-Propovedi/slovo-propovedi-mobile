import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { PlaylistData } from 'widgets';
import { OnPressTouchableListItem, TouchableListItem } from 'features';
import { COLORS, FONT_SIZES, INDENTS } from 'shared';

export const PlaylistListScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.PlaylistList>
> = ({
  route: {
    params: { playlists, title },
  },
  navigation: { navigate },
}) => {
  const onPressListItem: OnPressTouchableListItem<PlaylistData> = (params) => {
    navigate(ListenStackParamName.Playlist, params);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {playlists.map((playlist, index) => (
          <TouchableListItem
            key={`TouchableItem-${index}`}
            index={index}
            data={playlist}
            onPress={onPressListItem}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    padding: INDENTS.main,
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.main,
  },
  list: { paddingLeft: INDENTS.main },
});
