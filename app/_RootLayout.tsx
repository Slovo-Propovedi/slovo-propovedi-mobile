import { useAction } from '@reatom/npm-react'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { type ColorValue, View } from 'react-native'
import { AdminEntryButton } from 'pages/settings'
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
import { useHardwareBackCascade } from './_useHardwareBackCascade'
// Module-level: subscribes once for the app lifetime
subscribeToNetwork()

const RootLayout = () => {
  const { currentTheme } = useTheme()
  const checkForUpdate = useAction(checkForUpdateAction)
  useUpdateNotificationResponse()
  usePlaybackProgressSaver()
  useOfflineRegistrySync()
  useColdStartLinkRecovery()
  useHardwareBackCascade()

  const renderAdminEntry = (props: { tintColor?: ColorValue }) => (
    <AdminEntryButton tintColor={props.tintColor} />
  )

  useEffect(() => {
    const timer = setTimeout(() => void checkForUpdate(), 0)
    return () => clearTimeout(timer)
  }, [checkForUpdate])

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
        {SUB_SCREENS.map(({ name, title }) => (
          <Stack.Screen
            key={name}
            name={name}
            options={{
              headerLeft: props => <HeaderBackButton tintColor={props.tintColor} />,
              headerRight: name === 'settings' ? renderAdminEntry : undefined,
              headerStyle: { backgroundColor: currentTheme.background },
              headerTintColor: currentTheme.text,
              headerTitleStyle: { color: currentTheme.text },
              title,
            }}
          />
        ))}
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
