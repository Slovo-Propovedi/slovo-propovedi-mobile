/* eslint-disable max-lines -- FIXME: refactor */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared/config'

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
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    })
    this.audioModeConfigured = true
  }

  private updateStatus = () => {
    if (!this.playerInstance?.isLoaded) return

    this.setIsBuffering(this.playerInstance.isBuffering)
    this.setIsPlaying(this.playerInstance.playing)

    const dur = Math.floor(this.playerInstance.duration * 1000)
    this.setDuration(dur)

    // Don't update position while seeking - it's managed by seekTo
    if (!this.isSeeking) {
      const pos = Math.floor(this.playerInstance.currentTime * 1000)
      this.setPosition(pos)
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

    await this.configureAudioMode()

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }

    const player = createAudioPlayer({ uri: audioUrl }, { downloadFirst: true })
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

    if (this.playerInstance) {
      this.playerInstance.pause()
      this.playerInstance = null
    }
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
}

export const playerService = new PlayerService()
