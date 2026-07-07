import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NotesForPreachersBooksSlider } from 'widgets/notes-for-preachers-books-slider'
import { TopicalAndThematicBooksSlider } from 'widgets/topical-and-thematic-books-slider'
import { VerseByVerseBooksSlider } from 'widgets/verse-by-verse-books-slider'
import { useTheme } from 'shared/ui/themed'

export const ReadScreen = () => {
  const { currentTheme } = useTheme()
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView style={[styles.content, { backgroundColor: currentTheme.background }]}>
        <NotesForPreachersBooksSlider />
        <VerseByVerseBooksSlider />
        <TopicalAndThematicBooksSlider />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 100 },
})
