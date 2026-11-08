import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HelpHeaderButton, useTourScrollable } from 'features/onboarding'
import { useFeatureFlag } from 'entities/feature-flags'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { NotesForPreachersBooksSlider } from './NotesForPreachersBooksSlider'
import { TopicalAndThematicBooksSlider } from './TopicalAndThematicBooksSlider'
import { VerseByVerseBooksSlider } from './VerseByVerseBooksSlider'

export const ReadScreen = () => {
  const hasReadAccess = useFeatureFlag('read')
  const { currentTheme } = useTheme()
  const tourScrollableRef = useTourScrollable()

  // Флаги не загружены / нет доступа — экран не показывает контент.
  // Видимая блокировка таба остаётся в CustomTabBar (диалог «Скоро будет доступно»).
  if (!hasReadAccess) return null

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.read}>
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.topRow}>
          <HelpHeaderButton />
        </View>
        <ScrollView
          ref={tourScrollableRef}
          style={[styles.content, { backgroundColor: currentTheme.background }]}
        >
          <NotesForPreachersBooksSlider onboardingTargetId='read.notes' />
          <VerseByVerseBooksSlider onboardingTargetId='read.verse-by-verse' />
          <TopicalAndThematicBooksSlider onboardingTargetId='read.topical' />
        </ScrollView>
      </SafeAreaView>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 100 },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
})
