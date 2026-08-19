import { useAction } from '@reatom/npm-react'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'
import { BackHandler, InteractionManager, View } from 'react-native'
import { showMenuAtom, showPlaylistAtom } from 'widgets/expandable-player'
import { NetworkBanner, ServerErrorToast } from 'widgets/network-status'
import { UpdateBanner } from 'widgets/update-status'
import { useUpdateNotificationResponse } from 'features/update-notification'
import {
  closePlayerSheetAction,
  isPlayerExpandedAtom,
  usePlaybackProgressSaver,
} from 'entities/player'
import { subscribeToNetwork } from 'shared/lib/network'
import { ctx } from 'shared/lib/reatom-ctx'
import { checkForUpdateAction } from 'shared/model'
import { useTheme } from 'shared/ui/themed'

// Module-level: subscribes once for the app lifetime
subscribeToNetwork()

const RootLayout = () => {
  const { currentTheme } = useTheme()
  const checkForUpdate = useAction(checkForUpdateAction)
  useUpdateNotificationResponse()
  usePlaybackProgressSaver()

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      void checkForUpdate()
    })
    return () => handle.cancel()
  }, [checkForUpdate])

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentShowMenu = ctx.get(showMenuAtom)
      const currentShowPlaylist = ctx.get(showPlaylistAtom)
      const currentIsPlayerExpanded = ctx.get(isPlayerExpandedAtom)
      const canGoBack = router.canGoBack()

      if (currentShowMenu) {
        void ctx.schedule(() => {
          showMenuAtom(ctx, false)
        })
        return true
      }

      if (currentShowPlaylist) {
        void ctx.schedule(() => {
          showPlaylistAtom(ctx, false)
        })
        return true
      }

      if (currentIsPlayerExpanded) {
        void ctx.schedule(() => {
          void closePlayerSheetAction(ctx)
        })
        return true
      }

      if (canGoBack) {
        router.back()
        return true
      }

      return false
    })

    return () => listener.remove()
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: currentTheme.background },
        }}
      >
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
        <Stack.Screen
          name='settings'
          options={{
            headerBackTitle: 'Назад',
            headerStyle: { backgroundColor: currentTheme.background },
            headerTintColor: currentTheme.text,
            headerTitleStyle: { color: currentTheme.text },
            title: 'Настройки',
          }}
        />
        <Stack.Screen
          name='about'
          options={{
            headerBackTitle: 'Назад',
            headerStyle: { backgroundColor: currentTheme.background },
            headerTintColor: currentTheme.text,
            headerTitleStyle: { color: currentTheme.text },
            title: 'О приложении',
          }}
        />
      </Stack>
      <NetworkBanner />
      <ServerErrorToast />
      <UpdateBanner />
    </View>
  )
}

export default RootLayout
