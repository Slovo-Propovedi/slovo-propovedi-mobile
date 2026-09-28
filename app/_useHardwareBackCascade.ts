import { router } from 'expo-router'
import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import {
  showDetailsAtom,
  showMenuAtom,
  showPlaylistAtom,
  showSoundSettingsAtom,
} from 'widgets/expandable-player'
import { closePlayerSheetAction, isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'

// Hardware-back cascade, topmost layer first: details → menu → sound
// settings → playlist → expanded player → router history.
export const useHardwareBackCascade = () => {
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentShowDetails = ctx.get(showDetailsAtom)
      const currentShowMenu = ctx.get(showMenuAtom)
      const currentShowSoundSettings = ctx.get(showSoundSettingsAtom)
      const currentShowPlaylist = ctx.get(showPlaylistAtom)
      const currentIsPlayerExpanded = ctx.get(isPlayerExpandedAtom)
      const canGoBack = router.canGoBack()

      if (currentShowDetails) {
        void ctx.schedule(() => {
          showDetailsAtom(ctx, false)
        })
        return true
      }

      if (currentShowMenu) {
        void ctx.schedule(() => {
          showMenuAtom(ctx, false)
        })
        return true
      }

      if (currentShowSoundSettings) {
        void ctx.schedule(() => {
          showSoundSettingsAtom(ctx, false)
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
}
