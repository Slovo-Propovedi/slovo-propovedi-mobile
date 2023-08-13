import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { INDENTS, FONT_SIZES } from 'shared';

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
    <Text style={styles.title}>{title}</Text>
    {previewUrl && <Image style={styles.preview} source={{ uri: previewUrl }} />}

    {description && <Text style={styles.description}>{description}</Text>}

    <View style={styles.content}>{children}</View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { padding: INDENTS.main },
  title: {
    fontSize: FONT_SIZES.h1,
    paddingBottom: INDENTS.main,
  },
  preview: {
    width: '100%',
    height: windowHeight * 0.6,
  },
  description: {
    fontSize: FONT_SIZES.h4,
    padding: INDENTS.main,
  },
  content: {},
});
