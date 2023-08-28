import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { PlaylistData } from 'widgets';
import { OnPressTouchableListItem, TouchableListItem } from 'features';
import { COLORS, FONT_SIZES, INDENTS } from 'shared';

export const PlaylistListScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.PlaylistList>
> = ({ route, navigation: { navigate } }) => {
  const playlists = route.params;

  const onPressListItem: OnPressTouchableListItem<PlaylistData> = (params) => {
    navigate(ListenStackParamName.Playlist, params);
  };

  return (
    <View>
      {playlists.map((playlist, index) => (
        <TouchableListItem
          key={`TouchableItem-${index}`}
          index={index}
          data={playlist}
          onPress={onPressListItem}
        />
      ))}
    </View>
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
