import { useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { type ColorValue, View } from 'react-native'
import { SettingsHeaderMenu } from 'pages/settings'
import { useHardwareBackCascade } from 'widgets/expandable-player'
import { NetworkBanner, ServerErrorToast } from 'widgets/network-status'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { UpdateDialogRoot } from 'widgets/update-status'
import { useOfflineRegistrySync } from 'features/offline-sermons'
import { useUpdateNotificationResponse } from 'features/update-notification'
import { WebUpdateModal } from 'features/web-update'
import { usePlaybackProgressSaver } from 'entities/player'
import { subscribeToNetwork } from 'shared/lib/network'
import { checkForUpdateAction } from 'shared/model'
import { SUB_SCREENS, useColdStartLinkRecovery } from 'shared/routing'
import { Toast } from 'shared/ui'
import { GlobalConfirmDialog } from 'shared/ui/confirm-dialog'
import { GlobalErrorDialog } from 'shared/ui/error-dialog'
import { useTheme } from 'shared/ui/theme'
// Module-level: subscribes once for the app lifetime
subscribeToNetwork()

// Stable renderers: expo-router passes `options` into `navigation.setOptions`
// on every change (see expo-router Screen.js). A fresh inline function each
// render makes those options "change" → setState → re-render → setState loop
// ("Maximum update depth exceeded"). Module-level refs stay identical.
const renderHeaderBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} />
)

const renderSettingsMenu = (props: { tintColor?: ColorValue }) => (
  <SettingsHeaderMenu tintColor={props.tintColor} />
)

const RootLayout = () => {
  const { currentTheme } = useTheme()
  const checkForUpdate = useAction(checkForUpdateAction)
  useUpdateNotificationResponse()
  usePlaybackProgressSaver()
  useOfflineRegistrySync()
  useColdStartLinkRecovery()
  useHardwareBackCascade()

  useEffect(() => {
    const timer = setTimeout(() => void checkForUpdate(), 0)
    return () => clearTimeout(timer)
  }, [checkForUpdate])

  const subScreens = useMemo(
    () =>
      SUB_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderHeaderBack,
            headerRight: name === 'settings' ? renderSettingsMenu : undefined,
            headerStyle: { backgroundColor: currentTheme.background },
            headerTintColor: currentTheme.text,
            headerTitleStyle: { color: currentTheme.text },
            title,
          }}
        />
      )),
    [currentTheme],
  )

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: currentTheme.background },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen name='admin' options={{ headerShown: false }} />
        <Stack.Screen name='+not-found' options={{ headerShown: false }} />
        {subScreens}
      </Stack>
      <NetworkBanner />
      <ServerErrorToast />
      <Toast />
      <UpdateDialogRoot />
      <WebUpdateModal />
      <GlobalErrorDialog />
      <GlobalConfirmDialog />
    </View>
  )
}

export default RootLayout
