import React, { useState } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, IMAGE_PLACEHOLDER, INDENTS } from 'shared';

const windowHeight = Dimensions.get('window').height;

interface PlaylistProps {
  children: React.ReactElement | React.ReactElement[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  description?: string;
  previewUrl?: string;
  style?: StyleProp<ViewStyle>;
  title: string;
}

export const Playlist = ({
  children,
  contentContainerStyle,
  description,
  previewUrl,
  style,
  title,
}: PlaylistProps) => {
  const [previewLayout, setPreviewLayout] = useState({ height: 0, width: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setPreviewLayout({ height, width });
  };

  return (
    <ScrollView contentContainerStyle={contentContainerStyle} style={style}>
      <ImageBackground
        onLayout={handleLayout}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
        style={styles.preview}
      >
        <Text style={[styles.title, { marginTop: previewLayout.height / 3 }]}>{title}</Text>

        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>

      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: INDENTS.middle, paddingRight: 0 },

  description: {
    color: COLORS.white,
    fontSize: FONT_SIZES.h3,
    marginTop: 'auto',
    maxHeight: '20%',
    padding: INDENTS.high,
  },

  preview: {
    height: windowHeight * 0.7,
    width: '100%',
  },

  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingBottom: INDENTS.high,
  },
});
