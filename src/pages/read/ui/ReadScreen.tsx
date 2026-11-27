import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HelpHeaderButton, useTourScrollable } from 'features/onboarding'
import { useFeatureFlag } from 'entities/feature-flags'
import { BLUR_TARGET_ROUTES, BlurBackdrop, ScreenTitleRow, WideTopActions } from 'shared/ui'
import { useIsWideLayout } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { NotesForPreachersBooksSlider } from './NotesForPreachersBooksSlider'
import { TopicalAndThematicBooksSlider } from './TopicalAndThematicBooksSlider'
import { VerseByVerseBooksSlider } from './VerseByVerseBooksSlider'

export const ReadScreen = () => {
  const hasReadAccess = useFeatureFlag('read')
  const isWide = useIsWideLayout()
  const { currentTheme } = useTheme()
  const tourScrollableRef = useTourScrollable()

  // Флаги не загружены / нет доступа — экран не показывает контент.
  // Видимая блокировка таба остаётся в CustomTabBar (диалог «Скоро будет доступно»).
  if (!hasReadAccess) return null

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.read}>
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.body}>
          {/* Wide drops the row: the island inset is the gap, actions float above. */}
          {!isWide && (
            <ScreenTitleRow title='Читать'>
              <HelpHeaderButton />
            </ScreenTitleRow>
          )}
          <ScrollView
            ref={tourScrollableRef}
            style={[styles.content, { backgroundColor: currentTheme.background }]}
          >
            <NotesForPreachersBooksSlider onboardingTargetId='read.notes' />
            <VerseByVerseBooksSlider onboardingTargetId='read.verse-by-verse' />
            <TopicalAndThematicBooksSlider onboardingTargetId='read.topical' />
          </ScrollView>
          <WideTopActions>
            <HelpHeaderButton />
          </WideTopActions>
        </View>
      </SafeAreaView>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, paddingBottom: 100 },
})
