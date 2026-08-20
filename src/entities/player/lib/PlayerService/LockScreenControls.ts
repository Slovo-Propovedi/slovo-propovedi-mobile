import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri } from 'shared/lib/app-icon'
import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import type { LockScreenMetadata } from './types'

const RETRY_INTERVAL_MS = 200
const MAX_RETRY_ATTEMPTS = 10

class LockScreenControls {
  public setMetadata = (player: AudioPlayer | null, metadata: LockScreenMetadata): void => {
    if (!player) return

    // Invalidate any previous retry loop
    this.setMetadataVersion++
    const version = this.setMetadataVersion

    if (player.isLoaded) {
      this.applyMetadata(player, metadata)
      return
    }

    // Player not loaded yet — poll until loaded (bounded retry)
    let attempts = 0
    const interval = setInterval(() => {
      attempts++

      // Stale retry: newer setMetadata or clear() was called — bail out
      if (this.setMetadataVersion !== version) {
        clearInterval(interval)
        return
      }

      if (player.isLoaded) {
        clearInterval(interval)
        this.applyMetadata(player, metadata)
      } else if (attempts >= MAX_RETRY_ATTEMPTS) clearInterval(interval)
    }, RETRY_INTERVAL_MS)
  }

  public clear = (player: AudioPlayer | null): void => {
    // Invalidate any in-flight retry loop from a previous setMetadata call
    this.setMetadataVersion++

    if (!player?.isLoaded) return

    if (!isExpoGo) player.setActiveForLockScreen(false)
  }

  private applyMetadata = (player: AudioPlayer, metadata: LockScreenMetadata): void => {
    const artworkUrl = metadata.artworkUrl || getLocalAppIconUri() || undefined

    if (!isExpoGo)
      player.setActiveForLockScreen(
        true,
        { ...metadata, artworkUrl },
        {
          isLiveStream: false,
          showSeekBackward: true,
          showSeekForward: true,
        },
      )
  }

  private setMetadataVersion = 0
}

export const lockScreenControls = new LockScreenControls()
