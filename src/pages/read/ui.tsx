import React from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookReader,
  NotesForPreachersBooksSlider,
  TopicalAndThematicBooksSlider,
  VerseByVerseBooksSlider,
} from 'widgets';
import { COLORS, type ReadStackParamName, type ReadStackScreenProps } from 'shared';

export const ReadScreen: React.FC<ReadStackScreenProps<ReadStackParamName.Home>> = () => (
  <SafeAreaView style={styles.container}>
    <StatusBar backgroundColor='transparent' barStyle='dark-content' translucent />
    <ScrollView style={styles.content}>
      <BookReader />
      <NotesForPreachersBooksSlider />
      <VerseByVerseBooksSlider />
      <TopicalAndThematicBooksSlider />
    </ScrollView>
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
