import { type AudioPlayer } from 'expo-audio'
import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import type { LockScreenMetadata } from './types'

class LockScreenControls {
  public setMetadata = (player: AudioPlayer | null, metadata: LockScreenMetadata): void => {
    if (!player?.isLoaded) return

    // Skip lock screen controls in Expo Go - native audio services may not be properly initialized
    if (!isExpoGo)
      player.setActiveForLockScreen(true, metadata, {
        isLiveStream: false,
        showSeekBackward: true,
        showSeekForward: true,
      })
  }

  public clear = (player: AudioPlayer | null): void => {
    if (!player?.isLoaded) return

    if (!isExpoGo) player.setActiveForLockScreen(false)
  }
}

export const lockScreenControls = new LockScreenControls()
