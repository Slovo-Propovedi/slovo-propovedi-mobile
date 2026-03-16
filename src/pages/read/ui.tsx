import React from 'react'
import { ScrollView, StatusBar, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NotesForPreachersBooksSlider } from 'widgets/notes-for-preachers-books-slider'
import { TopicalAndThematicBooksSlider } from 'widgets/topical-and-thematic-books-slider'
import { VerseByVerseBooksSlider } from 'widgets/verse-by-verse-books-slider'
import { COLORS } from 'shared/themed'

export const ReadScreen = () => (
  <SafeAreaView style={styles.container}>
    <StatusBar translucent barStyle='dark-content' backgroundColor='transparent' />
    <ScrollView style={styles.content}>
      <NotesForPreachersBooksSlider />
      <VerseByVerseBooksSlider />
      <TopicalAndThematicBooksSlider />
    </ScrollView>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.white, flex: 1 },
  content: { backgroundColor: COLORS.white, flex: 1, paddingBottom: 100 },
})
