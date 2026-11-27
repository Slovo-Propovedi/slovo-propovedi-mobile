import { useAction, useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HelpHeaderButton, OnboardingTarget, useTourScrollable } from 'features/onboarding'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { BLUR_TARGET_ROUTES, BlurBackdrop, ScreenTitleRow, WideTopActions } from 'shared/ui'
import { useIsWideLayout, useScreenChromePadding, useSmoothInsetsPadding } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { AdminPanelButton } from './AdminPanelButton'
import { MoreMenuSettingsItem } from './MoreMenuSettingsItem'
import { styles } from './styles'

export const MoreScreen = () => {
  const insets = useSafeAreaInsets()
  const smoothInsetsPadding = useSmoothInsetsPadding(insets)
  const isWide = useIsWideLayout()
  const { topChromeScrollInset } = useScreenChromePadding()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const restore = useAction(restoreSession)
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)
  const tourScrollableRef = useTourScrollable()

  useEffect(() => {
    if (status !== 'idle') return

    void restore()
  }, [status, restore])

  const canOpenAdminPanel = status === 'authenticated' && canAccessAdmin(user)

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.more}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: currentTheme.background },
          smoothInsetsPadding,
        ]}
      >
        <View style={styles.body}>
          <ScrollView
            ref={tourScrollableRef}
            contentContainerStyle={{ paddingTop: topChromeScrollInset }}
          >
            {/* Wide drops the row: the island inset is the gap, actions float above. */}
            {!isWide && (
              <ScreenTitleRow title='Ещё'>
                {canOpenAdminPanel && <AdminPanelButton />}
                <HelpHeaderButton />
              </ScreenTitleRow>
            )}
            <View style={styles.headerTexts}>
              <Text style={[styles.appName, { color: currentTheme.text }]}>{APP_NAME}</Text>
              <Text style={styles.appVersion}>v{APP_VERSION}</Text>
            </View>
            <Text style={[styles.appDescription, { color: currentTheme.textMuted }]}>
              Приложение для прослушивания и чтения проповедей
            </Text>

            <OnboardingTarget id='more.menu' style={styles.menu}>
              <MoreMenuSettingsItem
                title='Офлайн'
                icon='cloud-offline-outline'
                onboardingTargetId='more.offline-item'
                onPress={() => router.push('/offline')}
              />
              <MoreMenuSettingsItem
                icon='time-outline'
                title='История прослушивания'
                onboardingTargetId='more.history-item'
                onPress={() => router.push('/history')}
              />
              <MoreMenuSettingsItem
                title='Настройки'
                icon='settings-outline'
                onboardingTargetId='more.settings-item'
                onPress={() => router.push('/settings')}
              />
              <MoreMenuSettingsItem
                title='О приложении'
                icon='information-circle-outline'
                onPress={() => router.push('/about')}
              />
              <MoreMenuSettingsItem
                icon='share-social-outline'
                title='Поделиться приложением'
                onboardingTargetId='more.share-item'
                onPress={() => router.push('/share')}
              />
            </OnboardingTarget>
          </ScrollView>
          <WideTopActions>
            {canOpenAdminPanel && <AdminPanelButton />}
            <HelpHeaderButton />
          </WideTopActions>
        </View>
      </Animated.View>
    </BlurBackdrop>
  )
}
