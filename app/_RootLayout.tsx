import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAtom } from '@reatom/npm-react'
import { router, Stack } from 'expo-router'
import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { showMenuAtom, showPlaylistAtom } from 'widgets/expandable-player'
import {
  closePlayerSheetAction,
  isPlayerExpandedAtom,
  isPlayingAtom,
  positionAtom,
} from 'entities/player'
import { CURRENT_SOUND_POSITION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { useTheme } from 'shared/ui/themed'

const RootLayout = () => {
  const { currentTheme } = useTheme()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [position] = useAtom(positionAtom)

  useEffect(() => {
    const savePosition = async () => {
      if (!isPlaying) await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(position))
    }
    const interval = setInterval(savePosition, 5000)
    return () => clearInterval(interval)
  }, [isPlaying, position])

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
  )
}

export default RootLayout
