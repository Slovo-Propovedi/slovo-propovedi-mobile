import React, { FC } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'shared';
import { COLORS, SIZES } from 'shared/config';

type SermonItemProps = {
  title: string;
  url: string;
};

export const SermonItem: FC<SermonItemProps> = ({ title, url }) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.url}>{url}</Text>
    <Button style={styles.button} title={'Смотреть'} />
  </View>
);

const styles = StyleSheet.create({
  item: { margin: 10, padding: 10, backgroundColor: COLORS.Gray, borderRadius: 10 },
  title: { fontSize: SIZES.h2, marginBottom: 30, color: COLORS.OnPrimary },
  url: { color: COLORS.Primary },
  button: { backgroundColor: COLORS.OnPrimary },
});
