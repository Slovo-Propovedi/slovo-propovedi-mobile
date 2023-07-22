import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PlaylistProps {
  title: string;
  children: React.ReactElement;
  previewUrl?: string;
  description?: string;
  style?: ViewStyle;
}

export const Playlist = ({ title, children, previewUrl, description, style }: PlaylistProps) => (
  <View style={{ ...styles.container, ...style }}>
    <Text style={styles.title}>{title}</Text>
    {previewUrl && <Image style={styles.preview} source={{ uri: previewUrl }} />}

    {description && <Text style={styles.description}>{description}</Text>}

    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {},
  title: {},
  preview: {},
  description: {},
  content: {},
});
