import React from 'react';
import { Image, Linking, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { TouchableImageBackground } from 'shared';

interface YoutubePreviewProps {
  url: string;
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
}

export const YoutubePreview = ({ url, previewSrc, style }: YoutubePreviewProps) => (
  <TouchableImageBackground
    previewSrc={previewSrc}
    onPress={() => {
      Linking.openURL(url);
    }}
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
  item: { minHeight: 50, minWidth: 50 },
  backgroundImage: {
    resizeMode: 'contain',
  },
  youtubeButton: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
