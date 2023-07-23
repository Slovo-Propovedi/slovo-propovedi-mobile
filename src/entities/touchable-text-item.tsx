import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { INDENTS, FONT_SIZES, TouchableItem, TouchableItemProps } from 'shared';

type TouchableTextItemProps = Omit<TouchableItemProps, 'children'> & { title: string };

export const TouchableTextItem = ({ title, onPress, disabled, style }: TouchableTextItemProps) => (
  <TouchableItem style={[style, styles.component]} onPress={onPress} disabled={disabled}>
    <Text style={styles.text}>{title}</Text>
  </TouchableItem>
);

const styles = StyleSheet.create({
  component: {
    minHeight: 50,
    padding: INDENTS.main,
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: FONT_SIZES.h3,
  },
});
