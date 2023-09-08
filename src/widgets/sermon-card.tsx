import React, { useEffect, useState } from 'react';
import { Dimensions, Linking, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { YoutubePreview } from 'features';
import { SermonData } from 'entities';
import {
  Button,
  COLORS,
  FONT_SIZES,
  GetYoutubeVideosResponseItem,
  INDENTS,
  MimeType,
  downloadFile,
  getYoutubeVideoData,
} from 'shared';

const windowHeight = Dimensions.get('window').height;

type SermonCardProps = SermonData & { style?: ViewStyle };

export const SermonCard = ({
  style,
  title,
  description,
  audioUrl,
  textFileUrl,
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
          url={youtubeUrl}
          style={styles.youtubePreview}
        />
      )}

      <View style={styles.buttonsGroup}>
        {audioUrl && (
          <>
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
              style={styles.listenLink}
              color={COLORS.onPrimary}
              title='Скачать аудио'
              onPress={() => {
                // audioUrl && Linking.openURL(audioUrl);

                audioUrl &&
                  downloadFile({ url: audioUrl, fileName: 'test.mp3', mimeType: MimeType.mp3 });
              }}
              titleStyle={styles.listenLinkTitle}
            />
          </>
        )}
        {textFileUrl && (
          <Button
            style={styles.textFileLink}
            titleStyle={styles.listenLinkTitle}
            color={COLORS.onPrimary}
            title='Читать'
            onPress={() => {
              textFileUrl && Linking.openURL(textFileUrl);
            }}
          />
        )}
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

  youtubePreview: {
    height: windowHeight * 0.24,
    width: '100%',
    resizeMode: 'contain',
    marginBottom: INDENTS.main,
  },

  buttonsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  listenLink: {
    backgroundColor: COLORS.primary,
  },
  listenLinkTitle: {
    fontSize: FONT_SIZES.h4,
  },
  watchLink: {
    backgroundColor: COLORS.primary,
  },
  textFileLink: {
    backgroundColor: COLORS.primary,
  },
});
