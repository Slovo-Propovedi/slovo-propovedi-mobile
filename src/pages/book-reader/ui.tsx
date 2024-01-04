import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookReader } from 'widgets';
import { COLORS, type ReadStackParamName, type ReadStackScreenProps } from 'shared';

export const BookReaderScreen: React.FC<ReadStackScreenProps<ReadStackParamName.BookReader>> = ({
  route: {
    params: { description, previewUrl, title },
  },
}) => {
  console.log('title: ', title);
  console.log('previewUrl: ', previewUrl);
  console.log('description: ', description);

  return (
    <SafeAreaView style={styles.container}>
      <Text>{title}</Text>
      <BookReader />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
});
