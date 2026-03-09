import React from 'react'
import { Image, Linking, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { TouchableImageBackground } from '../touchable-image-background'

interface YoutubePreviewProps {
  previewSrc: string
  style?: StyleProp<ViewStyle>
  url: string
}

export const YoutubePreview = ({ previewSrc, style, url }: YoutubePreviewProps) => (
  <TouchableImageBackground
    previewSrc={previewSrc}
    style={[styles.item, style]}
    onPress={() => {
      void Linking.openURL(url)
    }}
  >
    <Image
      style={[styles.youtubeButton]}
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Static asset import
      source={require('./assets/youtube-logo-png-2069.png')}
    />
  </TouchableImageBackground>
)

const styles = StyleSheet.create({
  backgroundImage: {
    resizeMode: 'contain',
  },
  item: { minHeight: 50, minWidth: 50 },
  youtubeButton: {
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
})
