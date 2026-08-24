import { type AudioPlayer } from 'expo-audio'
import { getLocalAppIconUri, hasUriProtocol } from 'shared/lib/app-icon'
import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import { reportError } from 'shared/model/error-dialog'
import type { LockScreenMetadata } from './types'

const RETRY_INTERVAL_MS = 200
const MAX_RETRY_ATTEMPTS = 10
const LOCK_SCREEN_ERROR_MESSAGE = 'Не удалось обновить данные плеера на экране блокировки'

type MetadataPayload = { artworkUrl?: string } & Omit<LockScreenMetadata, 'artworkUrl'>

class LockScreenControls {
  public setMetadata = (player: AudioPlayer | null, metadata: LockScreenMetadata): void => {
    if (!player) return

    // Same player (track switch): update metadata in place — keeps the existing
    // MediaSession/notification alive without a teardown race.
    // New player (first play / after unload): full activation required.
    const isSamePlayer = player === this.activePlayer
    const apply = () => {
      if (isSamePlayer) this.updateMetadata(player, metadata)
      else this.activateMetadata(player, metadata)
    }

    if (!isSamePlayer) this.activePlayer = player

    this.scheduleApply(player, apply)
  }

  // Foreground re-assertion: ALWAYS takes the full activation path
  // (setActiveForLockScreen(true)) even for the already-tracked player.
  // Unlike setMetadata's in-place update path, this re-binds the media session
  // natively — required when the OS/OEM killed the foreground service and every
  // track switch went through the (silently dropped) update path.
  public reassertMetadata = (player: AudioPlayer | null, metadata: LockScreenMetadata): void => {
    if (!player) return

    // Force full activation on subsequent setMetadata calls too
    this.activePlayer = player

    this.scheduleApply(player, () => this.activateMetadata(player, metadata))
  }

  public clear = (player: AudioPlayer | null): void => {
    // Invalidate any in-flight retry loop from a previous setMetadata call
    this.setMetadataVersion++
    this.activePlayer = null

    if (!player?.isLoaded || isExpoGo) return

    try {
      player.setActiveForLockScreen(false)
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  // Invalidate any in-flight retry loop, then apply immediately or poll until loaded
  private scheduleApply = (player: AudioPlayer, apply: () => void): void => {
    this.setMetadataVersion++
    const version = this.setMetadataVersion

    if (player.isLoaded) {
      apply()
      return
    }

    this.retryWhenLoaded(player, version, apply)
  }

  private retryWhenLoaded = (player: AudioPlayer, version: number, apply: () => void): void => {
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
        apply()
      } else if (attempts >= MAX_RETRY_ATTEMPTS) clearInterval(interval)
    }, RETRY_INTERVAL_MS)
  }

  private prepareMetadataPayload = (metadata: LockScreenMetadata): MetadataPayload => {
    const artworkUrl = [metadata.artworkUrl, getLocalAppIconUri()].find(hasUriProtocol)
    const { artworkUrl: _ignored, ...metadataWithoutArtwork } = metadata

    return { ...metadataWithoutArtwork, ...(artworkUrl ? { artworkUrl } : {}) }
  }

  private activateMetadata = (player: AudioPlayer, metadata: LockScreenMetadata): void => {
    if (isExpoGo) return

    try {
      player.setActiveForLockScreen(true, this.prepareMetadataPayload(metadata), {
        isLiveStream: false,
        showSeekBackward: true,
        showSeekForward: true,
      })
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private updateMetadata = (player: AudioPlayer, metadata: LockScreenMetadata): void => {
    if (isExpoGo) return

    try {
      player.updateLockScreenMetadata(this.prepareMetadataPayload(metadata))
    } catch (error) {
      console.error('[LockScreenControls] updateLockScreenMetadata failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private activePlayer: AudioPlayer | null = null
  private setMetadataVersion = 0
}

export const lockScreenControls = new LockScreenControls()
