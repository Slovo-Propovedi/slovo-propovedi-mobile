import React from 'react';
import {
  Image,
  ImageBackground,
  Linking,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

interface YoutubePreviewProps {
  url: string;
  previewSrc: string;
  style?: StyleProp<ViewStyle>;
}

export const YoutubePreview = ({ url, previewSrc, style }: YoutubePreviewProps) => (
  <TouchableOpacity
    onPress={() => {
      Linking.openURL(url);
    }}
  >
    <ImageBackground
      source={{ uri: previewSrc }}
      style={[styles.item, style]}
      imageStyle={styles.backgroundImage}
    >
      <Image
        //eslint-disable-next-line import/no-internal-modules
        source={require('../../assets/youtube-logo-png-2069.png')}
        style={[styles.youtubeButton]}
      />
    </ImageBackground>
  </TouchableOpacity>
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
