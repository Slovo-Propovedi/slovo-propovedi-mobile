import React, { useEffect, useState } from 'react'
import { Dimensions, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { downloadFile, getYoutubeVideoData } from 'shared/lib'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import { MimeType } from 'shared/types'
import { YoutubePreview } from 'shared/ui'
import type { ViewStyle } from 'react-native'
import type { GetYoutubeVideosResponseItem } from 'shared/lib'
import type { SermonData } from 'shared/types'

const windowHeight = Dimensions.get('window').height

type SermonCardProps = { style?: ViewStyle } & SermonData

export const SermonCard = ({
  audioUrl,
  description,
  style,
  textFileUrl,
  title,
  youtubeUrl,
}: SermonCardProps) => {
  const [videoData, setVideoData] = useState<GetYoutubeVideosResponseItem | null>(null)

  useEffect(() => {
    void (async () => {
      if (youtubeUrl) {
        const response = await getYoutubeVideoData(youtubeUrl)

        if (response) setVideoData(response)
      }
    })()
  }, [])

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {youtubeUrl && videoData && (
        <YoutubePreview
          url={youtubeUrl}
          style={styles.youtubePreview}
          previewSrc={videoData.snippet.thumbnails.medium.url}
        />
      )}

      <View style={styles.buttonsGroup}>
        {audioUrl && (
          <>
            <TouchableOpacity
              style={styles.listenLink}
              onPress={() => {
                if (audioUrl) void Linking.openURL(audioUrl)
              }}
            >
              <Text style={styles.buttonText}>Слушать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.listenLink}
              onPress={() => {
                if (audioUrl)
                  void downloadFile({ fileName: 'test.mp3', mimeType: MimeType.mp3, url: audioUrl })
              }}
            >
              <Text style={styles.buttonText}>Скачать аудио</Text>
            </TouchableOpacity>
          </>
        )}
        {textFileUrl && (
          <TouchableOpacity
            style={styles.textFileLink}
            onPress={() => {
              if (textFileUrl) void Linking.openURL(textFileUrl)
            }}
          >
            <Text style={styles.buttonText}>Читать</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  buttonsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontSize: FONT_SIZES.h4,
  },
  container: { padding: INDENTS.high },

  description: {
    fontSize: FONT_SIZES.h4,
    padding: INDENTS.high,
  },

  listenLink: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    padding: INDENTS.middle,
  },

  textFileLink: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    padding: INDENTS.middle,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h2,
    paddingVertical: INDENTS.high,
  },
  youtubePreview: {
    height: windowHeight * 0.24,
    marginBottom: INDENTS.high,
    width: '100%',
  },
})
