import AsyncStorage from '@react-native-async-storage/async-storage'
import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { CURRENT_SOUND_DURATION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import type { PlaybackRate } from '../../playback-rate'
import { currentAudioAtom, durationAtom } from '../../model'
import { setPlaybackRateAction } from '../../playback-rate'
import { savePlaybackProgress } from '../playbackProgress'
import { createPubSub } from './webPlayerPubSub'
import { createWebPlayerState } from './webPlayerState'
import { createStatusTracker } from './webPlayerStatusTracker'

class WebPlayerService {
  public getState = () => this.state.getState()

  public subscribe = (listener: () => void) => this.pubsub.subscribe(listener)

  public play = async () => {
    this.audioInstance?.play().catch(error => {
      console.error('[WebPlayerService] play failed:', error)
      reportError(error, 'Ошибка при воспроизведении аудио')
    })
    this.statusTracker.start()
  }

  public pause = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      const positionMs = Math.floor(this.audioInstance.currentTime * 1000)

      const sermonId = ctx.get(currentAudioAtom)?.id
      if (sermonId) {
        void savePlaybackProgress(ctx, {
          durationMs: ctx.get(durationAtom),
          positionMs,
          sermonId,
        })
        void flushHistoryProgressAction(ctx, {
          durationMs: ctx.get(durationAtom),
          positionMs,
          sermonId,
        })
      }
    }
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = async () => {
    if (this.audioInstance) {
      this.audioInstance.pause()
      this.audioInstance.currentTime = 0
    }
    this.statusTracker.stop()
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
    this.statusTracker.stop()

    if (this.audioInstance) this.audioInstance.pause()

    const audio = new Audio(audioUrl)
    this.audioInstance = audio

    if (this.playbackRate !== 1) audio.playbackRate = this.playbackRate

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
    this.statusTracker.stop()
    this.audioInstance?.pause()
    this.audioInstance = null
  }

  private audioInstance: HTMLAudioElement | null = null
  private onTrackEnd: (() => void) | undefined = undefined
  private playbackRate: PlaybackRate = 1
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private statusTracker = createStatusTracker(() => this.audioInstance, this.state)
}

export const playerService = new WebPlayerService()
