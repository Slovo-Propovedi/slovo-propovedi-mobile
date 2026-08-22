import AsyncStorage from '@react-native-async-storage/async-storage'
import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { CURRENT_SOUND_DURATION, CURRENT_SOUND_POSITION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { currentAudioAtom, durationAtom } from '../../model'
import { createPubSub } from './webPlayerPubSub'
import { createWebPlayerState } from './webPlayerState'

class WebPlayerService {
  public getState = () => this.state.getState()

  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public play = async () => {
    this.audioInstance?.play().catch(error => {
      console.error('[WebPlayerService] play failed:', error)
      reportError(error, 'Ошибка при воспроизведении аудио')
    })
    this.startStatusTracking()
  }

  public pause = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      const positionMs = Math.floor(this.audioInstance.currentTime * 1000)
      await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(positionMs))

      const sermonId = ctx.get(currentAudioAtom)?.id
      if (sermonId)
        void flushHistoryProgressAction(ctx, {
          durationMs: ctx.get(durationAtom),
          positionMs,
          sermonId,
        })
    }
    this.stopStatusTracking()
    this.state.setIsPlaying(false)
  }

  public stop = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      this.audioInstance.currentTime = 0
    }
    this.stopStatusTracking()
    this.state.setIsPlaying(false)
  }

  public seekTo = async (newPositionMs: number) => {
    if (this.audioInstance) {
      this.audioInstance.currentTime = newPositionMs / 1000
      this.state.setPosition(newPositionMs)
    }
  }

  public replaceAudio = async (audioUrl: string, initialPositionMs = 0) =>
    this.loadAudio(audioUrl, initialPositionMs)

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.state.setIsBuffering(true)
    this.stopStatusTracking()

    if (this.audioInstance) this.audioInstance.pause()

    const audio = new Audio(audioUrl)
    this.audioInstance = audio

    audio.addEventListener('loadedmetadata', () => {
      const dur = Math.floor(audio.duration * 1000)
      this.state.setDuration(dur)
      void AsyncStorage.setItem(CURRENT_SOUND_DURATION, String(dur))
      this.state.setIsBuffering(false)

      if (initialPositionMs > 0) {
        audio.currentTime = initialPositionMs / 1000
        this.state.setPosition(initialPositionMs)
      }
    })

    audio.addEventListener('play', () => this.state.setIsPlaying(true))
    audio.addEventListener('pause', () => this.state.setIsPlaying(false))
    audio.addEventListener('timeupdate', () => {
      this.state.setPosition(Math.floor(audio.currentTime * 1000))
    })
    audio.addEventListener('ended', () => {
      this.onTrackEnd?.()
    })

    return null
  }

  public unload = async () => {
    this.stopStatusTracking()
    this.audioInstance?.pause()
    this.audioInstance = null
  }

  private updateStatus = () => {
    if (!this.audioInstance) return
    this.state.setIsPlaying(!this.audioInstance.paused)
    this.state.setPosition(Math.floor(this.audioInstance.currentTime * 1000))
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

  private audioInstance: HTMLAudioElement | null = null
  private onTrackEnd: (() => void) | undefined = undefined
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private statusInterval: null | ReturnType<typeof setInterval> = null
}

export const playerService = new WebPlayerService()
