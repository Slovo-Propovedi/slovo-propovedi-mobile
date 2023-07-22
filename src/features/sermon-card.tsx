import React from 'react';
import { Linking, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button, SermonData } from 'shared';

type SermonCardProps = SermonData & { style?: ViewStyle };

export const SermonCard = ({
  style,
  title,
  audioUrl,
  description,
  textFileUrl,
  youtubeUrl,
}: SermonCardProps) => (
  <View style={style}>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    <Button
      style={styles.listenLink}
      title='Слушать'
      onPress={() => {
        console.log('audioUrl: ', audioUrl);
      }}
    />
    <Button
      style={styles.textFileLink}
      title='Читать'
      onPress={() => {
        console.log('textFileUrl: ', textFileUrl);
      }}
    />
    <Button
      style={styles.watchLink}
      title='Смотреть'
      onPress={() => {
        youtubeUrl && Linking.openURL(youtubeUrl);
      }}
    />
  </View>
);

const styles = StyleSheet.create({
  title: {},
  description: {},
  listenLink: {},
  watchLink: {},
  textFileLink: {},
});
