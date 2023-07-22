import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PlaylistProps {
  title: string;
  children: React.ReactElement;
  previewUrl?: string;
  description?: string;
  style?: ViewStyle;
}

export const Playlist = ({ title, children, previewUrl, description, style }: PlaylistProps) => (
  <ScrollView style={{ ...styles.container, ...style }}>
    <Text style={styles.title}>{title}</Text>
    {previewUrl && <Image style={styles.preview} source={{ uri: previewUrl }} />}

    {description && <Text style={styles.description}>{description}</Text>}

    <View style={styles.content}>{children}</View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {},
  title: {},
  preview: {
    width: '100%',
    height: 300,
  },
  description: {},
  content: {},
});
