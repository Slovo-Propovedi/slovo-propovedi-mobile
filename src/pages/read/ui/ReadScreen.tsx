import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFeatureFlag } from 'entities/feature-flags'
import { useTheme } from 'shared/ui/theme'
import { NotesForPreachersBooksSlider } from './NotesForPreachersBooksSlider'
import { TopicalAndThematicBooksSlider } from './TopicalAndThematicBooksSlider'
import { VerseByVerseBooksSlider } from './VerseByVerseBooksSlider'

export const ReadScreen = () => {
  const hasReadAccess = useFeatureFlag('read')
  const { currentTheme } = useTheme()

  // Флаги не загружены / нет доступа — экран не показывает контент.
  // Видимая блокировка таба остаётся в CustomTabBar (диалог «Скоро будет доступно»).
  if (!hasReadAccess) return null

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
