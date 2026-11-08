import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabView } from 'react-native-tab-view'
import { HelpHeaderButton, OnboardingTarget } from 'features/onboarding'
import { useFeatureFlag } from 'entities/feature-flags'
import { getRenderTabBar } from 'shared/lib/tab-bar'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { renderScene } from './scene'

export const StudyScreen = () => {
  const hasStudyAccess = useFeatureFlag('study')
  const { currentTheme } = useTheme()
  const [index, setIndex] = useState(0)

  // Флаги не загружены / нет доступа — экран не показывает контент.
  // Видимая блокировка таба остаётся в CustomTabBar (диалог «Скоро будет доступно»).
  if (!hasStudyAccess) return null

  const routes = [
    { key: 'first', title: 'Богословие' },
    { key: 'second', title: 'Душепопечение' },
  ]

  const renderTabBar = getRenderTabBar({
    setActiveTabIndex: setIndex,
  })

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.study}>
      <SafeAreaView style={{ backgroundColor: currentTheme.background, flex: 1 }}>
        <View style={styles.topRow}>
          <HelpHeaderButton />
        </View>
        <View style={{ backgroundColor: currentTheme.background, flex: 1, paddingBottom: 100 }}>
          <OnboardingTarget id='study.tabs' style={{ flex: 1 }}>
            <TabView
              onIndexChange={setIndex}
              renderScene={renderScene}
              renderTabBar={renderTabBar}
              navigationState={{ index, routes }}
            />
          </OnboardingTarget>
        </View>
      </SafeAreaView>
    </BlurBackdrop>
  )
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
})
