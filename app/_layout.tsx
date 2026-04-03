import { reatomContext } from '@reatom/npm-react'
import { router } from 'expo-router'
import React from 'react'
import { BackHandler } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { showPlaylistAtom } from 'widgets/expandable-player'
import { showMenuAtom } from 'widgets/expandable-player/model/showMenuAtom'
import { closePlayerSheetAction, initializePlayer, isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import RootLayout from './_RootLayout'

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout />
    </GestureHandlerRootView>
  </reatomContext.Provider>
)

void initializePlayer()

// Subscribe to back handler
BackHandler.addEventListener('hardwareBackPress', () => {
  const currentShowMenu = ctx.get(showMenuAtom)
  const currentShowPlaylist = ctx.get(showPlaylistAtom)
  const currentIsPlayerExpanded = ctx.get(isPlayerExpandedAtom)

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

  if (router.canGoBack()) {
    router.back()
    return true
  }

  return false
})

export default RootLayoutWithProvider
