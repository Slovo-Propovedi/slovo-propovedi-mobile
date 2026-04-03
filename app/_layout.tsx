import { reatomContext } from '@reatom/npm-react'
import { router } from 'expo-router'
import React from 'react'
import { BackHandler } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { showPlaylistAtom } from 'widgets/expandable-player'
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
  const currentShowPlaylist = ctx.get(showPlaylistAtom)
  const currentIsPlayerExpanded = ctx.get(isPlayerExpandedAtom)

  // Priority 1: Close playlist sheet if open
  if (currentShowPlaylist) {
    void ctx.schedule(() => {
      showPlaylistAtom(ctx, false)
    })
    return true
  }

  // Priority 2: Close expanded player sheet
  if (currentIsPlayerExpanded) {
    void ctx.schedule(() => {
      void closePlayerSheetAction(ctx)
    })
    return true
  }

  // Priority 3: Navigate back if possible
  if (router.canGoBack()) {
    router.back()
    return true
  }

  // Priority 4: Let system minimize the app
  return false
})

export default RootLayoutWithProvider
