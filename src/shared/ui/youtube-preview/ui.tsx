import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, Linking, StyleSheet } from 'react-native';
import { TouchableImageBackground } from 'shared';

interface YoutubePreviewProps {
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
  url: string;
}

export const YoutubePreview = ({ previewSrc, style, url }: YoutubePreviewProps) => (
  <TouchableImageBackground
    onPress={() => {
      Linking.openURL(url);
    }}
    previewSrc={previewSrc}
    style={[styles.item, style]}
  >
    <Image
      //eslint-disable-next-line import/no-internal-modules
      source={require('./assets/youtube-logo-png-2069.png')}
      style={[styles.youtubeButton]}
    />
  </TouchableImageBackground>
);

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
});
