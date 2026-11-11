import { AppState } from 'react-native'
import { isExpoGo } from 'shared/lib/isExpoEnvironment'
import { reportError } from 'shared/model/error-dialog'
import { type LockScreenMetadata } from '../types'
import { createIconFollowUp } from './IconFollowUp'
import { loadedRetryScheduler } from './LoadedRetryScheduler'
import { type PlayableAudio } from './playableAudio'
import { prepareMetadataPayload } from './prepareMetadataPayload'

const LOCK_SCREEN_ERROR_MESSAGE = 'Не удалось обновить данные плеера на экране блокировки'

class LockScreenControls {
  public setMetadata = (player: null | PlayableAudio, metadata: LockScreenMetadata): void => {
    if (!player) return

    this.iconFollowUp.track(player, metadata)

    // Same player (track switch): apply in place immediately — background auto-advance
    // freezes JS timers (locked screen), so a deferred update would never land (#149).
    if (player === this.activePlayer) {
      this.updateMetadata(player, metadata)
      return
    }

    // New player (first play / after unload): full activation required.
    this.activePlayer = player
    loadedRetryScheduler.schedule(
      () => player.isLoaded,
      () => this.activateWhenForeground(player, metadata),
    )
  }

  // Foreground re-assertion: ALWAYS takes the full activation path
  // (setActiveForLockScreen(true)) even for the already-tracked player.
  // Unlike setMetadata's in-place update path, this re-binds the media session
  // natively — required when the OS/OEM killed the foreground service and every
  // track switch went through the (silently dropped) update path.
  public reassertMetadata = (player: null | PlayableAudio, metadata: LockScreenMetadata): void => {
    if (!player) return

    // Force full activation on subsequent setMetadata calls too
    this.activePlayer = player

    loadedRetryScheduler.schedule(
      () => player.isLoaded,
      () => this.activateWhenForeground(player, metadata),
    )
  }

  public clear = (player: null | PlayableAudio): void => {
    // Invalidate any in-flight retry loop and pending activation from a previous call
    loadedRetryScheduler.invalidate()
    this.activePlayer = null
    this.pendingActivation = null
    this.activationSubscription?.remove()
    this.activationSubscription = null
    this.iconFollowUp.clear()

    if (!player?.isLoaded || isExpoGo) return

    try {
      player.setActiveForLockScreen(false)
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  // Full activation starts the expo-audio foreground service. Android 12+ forbids
  // starting an FGS while the app is not foreground-permitted — expo-audio catches
  // ForegroundServiceStartNotAllowedException and logs "Failed to start the
  // expo-audio foreground service...". Cold-start restore can reach this while
  // paused/backgrounded, so defer to the next foreground transition: lock-screen
  // controls still appear via the notification fallback and activate then.
  private activateWhenForeground = (player: PlayableAudio, metadata: LockScreenMetadata): void => {
    if (AppState.currentState === 'active') return this.activateMetadata(player, metadata)

    this.pendingActivation = { metadata, player }
    if (this.activationSubscription) return

    this.activationSubscription = AppState.addEventListener('change', state => {
      if (state !== 'active') return

      this.activationSubscription?.remove()
      this.activationSubscription = null
      const pending = this.pendingActivation
      this.pendingActivation = null
      // clear() nulls activePlayer, dropping a stale pending activation.
      if (pending && pending.player === this.activePlayer)
        this.activateMetadata(pending.player, pending.metadata)
    })
  }

  private activateMetadata = (player: PlayableAudio, metadata: LockScreenMetadata): void => {
    if (isExpoGo) return

    try {
      player.setActiveForLockScreen(true, prepareMetadataPayload(metadata), {
        isLiveStream: false,
        // Explicit intervals: an omitted optimized-record field arrives as 0.0 natively
        // and degrades to the 100 ms minimum instead of the documented 10 s default.
        seekBackwardIntervalSeconds: 10,
        seekForwardIntervalSeconds: 10,
        showSeekBackward: true,
        showSeekForward: true,
      })
    } catch (error) {
      console.error('[LockScreenControls] setActiveForLockScreen failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private updateMetadata = (player: PlayableAudio, metadata: LockScreenMetadata): void => {
    if (isExpoGo) return

    try {
      player.updateLockScreenMetadata(prepareMetadataPayload(metadata))
    } catch (error) {
      console.error('[LockScreenControls] updateLockScreenMetadata failed:', error)
      reportError(error, LOCK_SCREEN_ERROR_MESSAGE)
    }
  }

  private readonly iconFollowUp = createIconFollowUp(this.setMetadata)
  private activePlayer: null | PlayableAudio = null
  private activationSubscription: null | ReturnType<typeof AppState.addEventListener> = null
  private pendingActivation: { metadata: LockScreenMetadata; player: PlayableAudio } | null = null
}

export const lockScreenControls = new LockScreenControls()
