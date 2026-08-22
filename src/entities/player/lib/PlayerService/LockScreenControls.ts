import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri, hasUriProtocol } from 'shared/lib/app-icon'
import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import { reportError } from 'shared/model/error-dialog'
import type { LockScreenMetadata } from './types'

const RETRY_INTERVAL_MS = 200
const MAX_RETRY_ATTEMPTS = 10
const LOCK_SCREEN_ERROR_MESSAGE = 'Не удалось обновить данные плеера на экране блокировки'

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

    if (!player?.isLoaded || isExpoGo) return

    try {
      player.setActiveForLockScreen(false)
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private applyMetadata = (player: AudioPlayer, metadata: LockScreenMetadata): void => {
    const artworkUrl = [metadata.artworkUrl, getLocalAppIconUri()].find(hasUriProtocol)
    const { artworkUrl: _ignored, ...metadataWithoutArtwork } = metadata

    if (isExpoGo) return

    try {
      player.setActiveForLockScreen(
        true,
        { ...metadataWithoutArtwork, ...(artworkUrl ? { artworkUrl } : {}) },
        {
          isLiveStream: false,
          showSeekBackward: true,
          showSeekForward: true,
        },
      )
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private setMetadataVersion = 0
}

export const lockScreenControls = new LockScreenControls()
