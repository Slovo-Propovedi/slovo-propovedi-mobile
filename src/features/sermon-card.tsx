import React from 'react';
import { Linking, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button, COLORS, FONT_SIZES, INDENTS, SermonData } from 'shared';
import { getYoutubeVideoData } from 'shared/lib';

type SermonCardProps = SermonData & { style?: ViewStyle };

export const SermonCard = ({
  style,
  title,
  audioUrl,
  description,
  textFileUrl,
  youtubeUrl,
}: SermonCardProps) => {
  const videoData = (youtubeUrl && getYoutubeVideoData(youtubeUrl)) || null;
  videoData?.then((result) => {
    console.log('result: ', result);
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.buttonsGroup}>
        <Button
          style={styles.listenLink}
          color={COLORS.onPrimary}
          title='Слушать'
          onPress={() => {
            audioUrl && Linking.openURL(audioUrl);
          }}
          titleStyle={styles.listenLinkTitle}
        />
        <Button
          style={styles.textFileLink}
          color={COLORS.onPrimary}
          title='Читать'
          onPress={() => {
            textFileUrl && Linking.openURL(textFileUrl);
          }}
        />
        <Button
          style={styles.listenLink}
          color={COLORS.onPrimary}
          title='Скачать аудио'
          onPress={() => {
            audioUrl && Linking.openURL(audioUrl);

            // audioUrl &&
            //   downloadFile({ url: audioUrl, filename: 'test', mimeType: 'application/pdf' });
          }}
          titleStyle={styles.listenLinkTitle}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: INDENTS.main },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.main,
  },

  description: {
    fontSize: FONT_SIZES.h4,
    padding: INDENTS.main,
  },
  buttonsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  listenLink: {
    backgroundColor: COLORS.primary,
  },
  listenLinkTitle: {
    // fontSize: FONT_SIZES.h4,
  },
  watchLink: {
    backgroundColor: COLORS.primary,
  },
  textFileLink: {
    backgroundColor: COLORS.primary,
  },
});
