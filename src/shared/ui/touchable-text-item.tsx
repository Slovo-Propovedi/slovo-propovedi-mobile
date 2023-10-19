import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FONT_SIZES, INDENTS } from 'shared/themed';
import type { TouchableItemProps } from 'shared/ui/touchable-item';
import { TouchableItem } from 'shared/ui/touchable-item';

type TouchableTextItemProps = Omit<TouchableItemProps, 'children'> & { title: string };

export const TouchableTextItem = ({ disabled, onPress, style, title }: TouchableTextItemProps) => (
  <TouchableItem disabled={disabled} onPress={onPress} style={[style, styles.component]}>
    <Text style={styles.text}>{title}</Text>
  </TouchableItem>
);

const styles = StyleSheet.create({
  component: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
    padding: INDENTS.main,
  },
  text: {
    fontSize: FONT_SIZES.h3,
  },
});
