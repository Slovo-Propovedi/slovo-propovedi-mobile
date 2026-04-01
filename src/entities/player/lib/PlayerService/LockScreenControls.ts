import { type AudioPlayer } from 'expo-audio'
import type { LockScreenMetadata } from './types'

class LockScreenControls {
  public setMetadata = (player: AudioPlayer | null, metadata: LockScreenMetadata): void => {
    if (!player?.isLoaded) return

    player.setActiveForLockScreen(true, metadata, {
      showSeekBackward: true,
      showSeekForward: true,
    })
  }

  public clear = (player: AudioPlayer | null): void => {
    if (!player?.isLoaded) return

    player.setActiveForLockScreen(false)
  }
}

export const lockScreenControls = new LockScreenControls()
