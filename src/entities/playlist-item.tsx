import React from 'react';
import { GestureResponderEvent, StyleSheet, Text } from 'react-native';
import { FONT_SIZES, INDENTS, SermonData, TouchableItem, getBookLinkAsString } from 'shared';

export type OnPressPlaylistItem = (sermon: SermonData, event: GestureResponderEvent) => void;

interface PlaylistItemProps {
  index: number;
  sermon: SermonData;
  onPressPlaylistItem: OnPressPlaylistItem;
}

export const PlaylistItem = ({ index, sermon, onPressPlaylistItem }: PlaylistItemProps) => (
  <TouchableItem style={styles.listItem} onPress={(event) => onPressPlaylistItem(sermon, event)}>
    <Text style={styles.listItemTitle}>
      {`${index + 1}. ${getBookLinkAsString({
        title: sermon.title,
        verse: sermon.verse,
        chapter: sermon.chapter,
      })}`}
    </Text>
  </TouchableItem>
);

const styles = StyleSheet.create({
  listItem: {
    minHeight: 50,
    marginBottom: INDENTS.main,
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: INDENTS.main,
  },
  listItemTitle: {
    fontSize: FONT_SIZES.h3,
  },
});
