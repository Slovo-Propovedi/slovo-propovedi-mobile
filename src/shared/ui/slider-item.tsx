import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableImageBackground } from './touchable-image-background';

interface SliderItemProps {
  previewURL: string;
  description?: string;
}

export const SliderItem = ({ previewURL, description }: SliderItemProps) => {
  if (!previewURL) {
    return null;
  }

  return (
    <TouchableImageBackground previewSrc={previewURL}>
      {description && (
        <View testID='slider-item-description'>
          <Text></Text>
        </View>
      )}
    </TouchableImageBackground>
  );
};

const styles = StyleSheet.create({});
