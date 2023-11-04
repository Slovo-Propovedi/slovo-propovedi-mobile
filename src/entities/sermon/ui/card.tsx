import React, { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
import { Dimensions, Linking, StyleSheet, Text, View } from 'react-native';
import type { GetYoutubeVideosResponseItem, SermonData } from 'shared';
import {
  Button,
  COLORS,
  FONT_SIZES,
  INDENTS,
  MimeType,
  YoutubePreview,
  downloadFile,
  getYoutubeVideoData,
} from 'shared';

const windowHeight = Dimensions.get('window').height;

type SermonCardProps = SermonData & { style?: ViewStyle };

export const SermonCard = ({
  audioUrl,
  description,
  style,
  textFileUrl,
  title,
  youtubeUrl,
}: SermonCardProps) => {
  const [videoData, setVideoData] = useState<GetYoutubeVideosResponseItem | null>(null);

  useEffect(() => {
    (async () => {
      if (youtubeUrl) {
        const response = await getYoutubeVideoData(youtubeUrl);

        if (response) {
          setVideoData(response);
        }
      }
    })();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {youtubeUrl && videoData && (
        <YoutubePreview
          previewSrc={videoData.snippet.thumbnails.medium.url}
          style={styles.youtubePreview}
          url={youtubeUrl}
        />
      )}

      <View style={styles.buttonsGroup}>
        {audioUrl && (
          <>
            <Button
              color={COLORS.onPrimary}
              onPress={() => {
                audioUrl && Linking.openURL(audioUrl);
              }}
              style={styles.listenLink}
              title='Слушать'
              titleStyle={styles.listenLinkTitle}
            />
            <Button
              color={COLORS.onPrimary}
              onPress={() => {
                // audioUrl && Linking.openURL(audioUrl);

                audioUrl &&
                  downloadFile({ fileName: 'test.mp3', mimeType: MimeType.mp3, url: audioUrl });
              }}
              style={styles.listenLink}
              title='Скачать аудио'
              titleStyle={styles.listenLinkTitle}
            />
          </>
        )}
        {textFileUrl && (
          <Button
            color={COLORS.onPrimary}
            onPress={() => {
              textFileUrl && Linking.openURL(textFileUrl);
            }}
            style={styles.textFileLink}
            title='Читать'
            titleStyle={styles.listenLinkTitle}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  container: { padding: INDENTS.high },

  description: {
    fontSize: FONT_SIZES.h4,
    padding: INDENTS.high,
  },

  listenLink: {
    backgroundColor: COLORS.primary,
  },

  listenLinkTitle: {
    fontSize: FONT_SIZES.h4,
  },
  textFileLink: {
    backgroundColor: COLORS.primary,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.high,
  },
  watchLink: {
    backgroundColor: COLORS.primary,
  },
  youtubePreview: {
    height: windowHeight * 0.24,
    marginBottom: INDENTS.high,
    resizeMode: 'contain',
    width: '100%',
  },
});
