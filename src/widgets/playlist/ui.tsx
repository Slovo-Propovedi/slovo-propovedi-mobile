import React, { useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  LayoutChangeEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { INDENTS, FONT_SIZES, COLORS, IMAGE_PLACEHOLDER } from 'shared';

const windowHeight = Dimensions.get('window').height;

interface PlaylistProps {
  title: string;
  children: React.ReactElement | React.ReactElement[];
  previewUrl?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const Playlist = ({
  title,
  children,
  previewUrl,
  description,
  style,
  contentContainerStyle,
}: PlaylistProps) => {
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewLayout({ width, height });
  };

  return (
    <ScrollView style={style} contentContainerStyle={contentContainerStyle}>
      <ImageBackground
        style={styles.preview}
        source={{ uri: previewUrl || IMAGE_PLACEHOLDER }}
        onLayout={handleLayout}
      >
        <Text style={[styles.title, { marginTop: previewLayout.height / 3 }]}>{title}</Text>

        {description && <Text style={styles.description}>{description}</Text>}
      </ImageBackground>

      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.h1,
    paddingBottom: INDENTS.main,
    marginLeft: 'auto',
    marginRight: 'auto',
    color: COLORS.primary,
  },

  preview: {
    width: '100%',
    height: windowHeight * 0.7,
  },

  description: {
    padding: INDENTS.main,
    marginTop: 'auto',
    maxHeight: '20%',
    fontSize: FONT_SIZES.h3,
    color: COLORS.white,
  },

  content: { padding: INDENTS.low, paddingRight: 0 },
});
