import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookReader } from 'widgets';
import { COLORS, type ReadStackParamName, type ReadStackScreenProps } from 'shared';

export const BookReaderScreen: React.FC<ReadStackScreenProps<ReadStackParamName.BookReader>> = ({
  route: {
    params: { description, previewUrl, title },
  },
}) => (
  <SafeAreaView style={styles.container}>
    <Image source={{ uri: previewUrl }} style={{ height: 100, width: 100 }} />
    <Text>{title}</Text>
    <Text>{description}</Text>
    <BookReader />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
});
