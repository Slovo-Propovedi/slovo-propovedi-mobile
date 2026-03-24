/* eslint-disable max-lines -- FIXME: refactor */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared/config'
import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  setDownloadingUrlAction,
  setDownloadProgressAction,
  setIsDownloadingAction,
} from '../download-model'

interface LockScreenMetadata {
  albumTitle?: string
  artist?: string
  artworkUrl?: string
  title: string
}

type StateListener = () => void

class PlayerService {
  public getState = () => ({
    duration: this.duration,
    isBuffering: this.isBuffering,
    isPlaying: this.isPlaying,
    position: this.position,
    volume: this.volume,
  })

  public subscribe = (listener: StateListener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify = () => {
    this.listeners.forEach(listener => listener())
  }

  private setDuration = (value: number) => {
    this.duration = value
    this.notify()
  }

  private setPosition = (value: number) => {
    this.position = value
    this.notify()
  }

  private setIsBuffering = (value: boolean) => {
    this.isBuffering = value
    this.notify()
  }

  private setIsPlaying = (value: boolean) => {
    this.isPlaying = value
    this.notify()
  }

  private configureAudioMode = async () => {
    if (this.audioModeConfigured) return
    await setAudioModeAsync({
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    })
    this.audioModeConfigured = true
  }

  public setLockScreenMetadata = (metadata: LockScreenMetadata) => {
    this.currentLockScreenMetadata = metadata
    if (this.playerInstance?.isLoaded) this.playerInstance.setActiveForLockScreen(true, metadata)
  }

  public clearLockScreenControls = () => {
    if (this.playerInstance?.isLoaded) this.playerInstance.setActiveForLockScreen(false)
    this.currentLockScreenMetadata = null
  }

  private updateStatus = () => {
    if (!this.playerInstance?.isLoaded) return

    const wasPlaying = this.isPlaying
    this.setIsBuffering(this.playerInstance.isBuffering)
    this.setIsPlaying(this.playerInstance.playing)

    const dur = Math.floor(this.playerInstance.duration * 1000)
    this.setDuration(dur)

    // Don't update position while seeking - it's managed by seekTo
    if (!this.isSeeking) {
      const pos = Math.floor(this.playerInstance.currentTime * 1000)
      this.setPosition(pos)

      // FALLBACK: Detect track end via polling
      // Trigger when:
      // 1. Position is within 3 seconds of end, OR
      // 2. Player stopped (playing went from true to false) and position is past 90% of duration
      const isNearEnd = dur > 0 && pos >= dur - 3000
      const playerStoppedNearEnd =
        !this.playerInstance.playing && wasPlaying && dur > 0 && pos >= dur * 0.9

      if ((isNearEnd || playerStoppedNearEnd) && !this.trackEndHandled) {
        this.trackEndHandled = true
        this.onTrackEnd?.()
      }

      // Reset flag when position is far from end (new track or seeked back)
      if (dur > 0 && pos < dur - 10000) this.trackEndHandled = false
    }
  }

  private startStatusTracking = () => {
    if (this.statusInterval) clearInterval(this.statusInterval)
    this.statusInterval = setInterval(this.updateStatus, 500)
  }

  private stopStatusTracking = () => {
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
      this.statusInterval = null
    }
  }

  public play = async () => {
    await this.configureAudioMode()

    if (this.playerInstance?.isLoaded) {
      this.playerInstance.play()
      this.startStatusTracking()
    }
  }

  public pause = async () => {
    if (this.playerInstance) {
      this.playerInstance.pause()
      await AsyncStorage.setItem(
        CURRENT_SOUND_POSITION,
        String(Math.floor(this.playerInstance.currentTime * 1000)),
      )
      this.stopStatusTracking()
      this.setIsPlaying(false)
    }
  }

  public stop = async () => {
    if (this.playerInstance) {
      this.playerInstance.pause()
      await this.playerInstance.seekTo(0)
      this.stopStatusTracking()
      this.setIsPlaying(false)
    }
  }

  public seekTo = async (newPositionMs: number) => {
    if (this.playerInstance) {
      // Clamp position to valid range [0, duration]
      const clampedPosition = Math.max(0, Math.min(this.duration, newPositionMs))
      this.isSeeking = true
      this.setPosition(clampedPosition) // Update immediately for UI responsiveness
      await this.playerInstance.seekTo(clampedPosition / 1000)
      this.isSeeking = false
    }
  }

  public getVolume = () => this.volume

  public setVolume = async (newVolume: number) => {
    this.volume = Math.max(0, Math.min(1, newVolume))
    if (this.playerInstance?.isLoaded) this.playerInstance.volume = this.volume

    this.notify()
  }

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.setIsBuffering(true)
    this.stopStatusTracking()
    this.setPosition(0)
    this.trackEndHandled = false

    await this.configureAudioMode()

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }

    // Check if audio is already cached
    let playUrl = audioUrl
    try {
      const cachedUri = await audioCacheService.getCachedUri(audioUrl)
      if (cachedUri) playUrl = cachedUri
      // Start background caching without blocking playback
      else this.startBackgroundCaching(audioUrl)
    } catch (error) {
      console.error('[PlayerService] Error checking cache:', error)
      // Continue with remote URL if cache check fails
    }

    const player = createAudioPlayer({ uri: playUrl }, { downloadFirst: true })
    this.playerInstance = player

    return new Promise<AudioPlayer | null>(resolve => {
      const maxWait = 30000
      const checkInterval = 100
      let elapsed = 0

      const checkLoaded = setInterval(() => {
        elapsed += checkInterval

        if (player.isLoaded) {
          clearInterval(checkLoaded)

          const dur = Math.floor(player.duration * 1000)
          this.setDuration(dur)
          void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
          this.setIsBuffering(false)

          if (initialPositionMs > 0) void player.seekTo(initialPositionMs / 1000)
          this.setPosition(initialPositionMs)

          this.updateStatus()
          this.setupTrackEndListener()
          resolve(player)
        } else if (elapsed >= maxWait) {
          clearInterval(checkLoaded)
          this.setIsBuffering(false)
          resolve(null)
        }
      }, checkInterval)
    })
  }

  public unload = async () => {
    this.stopStatusTracking()

    // Clear lock screen controls
    this.clearLockScreenControls()

    if (this.trackEndSubscription) {
      this.trackEndSubscription.remove()
      this.trackEndSubscription = null
    }

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }
  }

  private setupTrackEndListener = () => {
    // Remove old subscription if exists
    if (this.trackEndSubscription) {
      this.trackEndSubscription.remove()
      this.trackEndSubscription = null
    }

    if (!this.playerInstance) {
      console.warn('[PlayerService] setupTrackEndListener: no playerInstance')
      return
    }

    this.trackEndSubscription = this.playerInstance.addListener('playbackStatusUpdate', status => {
      if (status.didJustFinish && !this.trackEndHandled) {
        this.trackEndHandled = true
        this.onTrackEnd?.()
      }
    })
  }

  private startBackgroundCaching = (audioUrl: string) => {
    // Update download state atoms
    setIsDownloadingAction(ctx, true)
    setDownloadingUrlAction(ctx, audioUrl)
    setDownloadProgressAction(ctx, 0)

    // Start download in background (don't await)
    audioCacheService
      .cacheAudio(audioUrl, progress => {
        setDownloadProgressAction(ctx, progress)
      })
      .then(() => {
        setDownloadProgressAction(ctx, 1)
      })
      .catch(error => {
        console.error('[PlayerService] Background caching failed:', error)
      })
      .finally(() => {
        setIsDownloadingAction(ctx, false)
        setDownloadingUrlAction(ctx, null)
      })
  }

  private duration = 0
  private position = 0
  private volume = 1
  private isBuffering = false
  private isPlaying = false
  private listeners: Set<StateListener> = new Set()
  private audioModeConfigured = false
  private playerInstance: AudioPlayer | null = null
  private statusInterval: null | ReturnType<typeof setInterval> = null
  private isSeeking = false
  private trackEndSubscription: { remove: () => void } | null = null
  private trackEndHandled = false
  private currentLockScreenMetadata: LockScreenMetadata | null = null

  public onTrackEnd: (() => void) | undefined = undefined
}

export const playerService = new PlayerService()
