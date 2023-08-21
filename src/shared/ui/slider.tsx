import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SliderProps {
  items: [];
}

export const Slider = ({ items }: SliderProps) => {
  if (!items || !items.length) {
    return null;
  }

  return (
    <View>
      <Text>slider</Text>
    </View>
  );
};

const styles = StyleSheet.create({});
