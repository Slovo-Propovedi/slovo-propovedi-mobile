import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from 'shared/ui/themed'
import { NotesForPreachersBooksSlider } from './NotesForPreachersBooksSlider'
import { TopicalAndThematicBooksSlider } from './TopicalAndThematicBooksSlider'
import { VerseByVerseBooksSlider } from './VerseByVerseBooksSlider'

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
