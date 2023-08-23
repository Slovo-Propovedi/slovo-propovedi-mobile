import React from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { INDENTS, FONT_SIZES, COLORS } from 'shared';

const windowHeight = Dimensions.get('window').height;

interface PlaylistProps {
  title: string;
  children: React.ReactElement | React.ReactElement[];
  previewUrl?: string;
  description?: string;
  style?: ViewStyle;
}

export const Playlist = ({ title, children, previewUrl, description, style }: PlaylistProps) => (
  <ScrollView style={[styles.container, style]}>
    {previewUrl && (
      <ImageBackground style={styles.preview} source={{ uri: previewUrl }}>
        <Text style={styles.title}>{title}</Text>

        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>
    )}

    <View style={styles.content}>{children}</View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: FONT_SIZES.h1,
    paddingBottom: INDENTS.main,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '50%',
    color: COLORS.primary,
  },
  preview: {
    width: '100%',
    height: windowHeight * 0.6,
  },
  description: {
    fontSize: FONT_SIZES.h3,
    padding: INDENTS.main,
    marginTop: 'auto',
    maxHeight: '20%',
    color: COLORS.white,
  },
  content: { padding: INDENTS.low },
});
