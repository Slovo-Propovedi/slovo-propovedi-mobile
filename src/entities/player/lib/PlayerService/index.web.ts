/* eslint-disable max-lines -- FIXME: refactor */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared/config'

type StateListener = () => void

class WebPlayerService {
  public getState = () => ({
    duration: this.duration,
    isBuffering: this.isBuffering,
    isPlaying: this.isPlaying,
    position: this.position,
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

  private updateStatus = () => {
    if (!this.audioInstance) return
    this.setIsPlaying(!this.audioInstance.paused)
    this.setPosition(Math.floor(this.audioInstance.currentTime * 1000))
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
    this.audioInstance?.play().catch(console.error)
    this.startStatusTracking()
  }

  public pause = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      await AsyncStorage.setItem(
        CURRENT_SOUND_POSITION,
        String(Math.floor(this.audioInstance.currentTime * 1000)),
      )
    }
    this.stopStatusTracking()
    this.setIsPlaying(false)
  }

  public stop = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      this.audioInstance.currentTime = 0
    }
    this.stopStatusTracking()
    this.setIsPlaying(false)
  }

  public seekTo = async (newPositionMs: number) => {
    if (this.audioInstance) {
      this.audioInstance.currentTime = newPositionMs / 1000
      this.setPosition(newPositionMs)
    }
  }

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.setIsBuffering(true)
    this.stopStatusTracking()

    if (this.audioInstance) this.audioInstance.pause()

    const audio = new Audio(audioUrl)
    this.audioInstance = audio

    audio.addEventListener('loadedmetadata', () => {
      const dur = Math.floor(audio.duration * 1000)
      this.setDuration(dur)
      void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
      this.setIsBuffering(false)

      if (initialPositionMs > 0) {
        audio.currentTime = initialPositionMs / 1000
        this.setPosition(initialPositionMs)
      }
    })

    audio.addEventListener('play', () => this.setIsPlaying(true))
    audio.addEventListener('pause', () => this.setIsPlaying(false))
    audio.addEventListener('timeupdate', () => {
      this.setPosition(Math.floor(audio.currentTime * 1000))
    })

    return null
  }

  public unload = async () => {
    this.stopStatusTracking()
    this.audioInstance?.pause()
    this.audioInstance = null
  }

  private duration = 0
  private position = 0
  private isBuffering = false
  private isPlaying = false
  private listeners: Set<StateListener> = new Set()
  private audioInstance: HTMLAudioElement | null = null
  private statusInterval: null | ReturnType<typeof setInterval> = null
}

export const playerService = new WebPlayerService()
