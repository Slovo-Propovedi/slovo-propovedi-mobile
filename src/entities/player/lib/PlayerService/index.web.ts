import { flushHistoryProgressAction } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import type { PlaybackRate } from '../../playback-rate'
import { currentAudioAtom, durationAtom } from '../../model'
import { setPlaybackRateAction } from '../../playback-rate'
import { savePlaybackProgress } from '../playbackProgress'
import { scheduleHistoryFlush } from './progressFlusher'
import { attachWebAudioEvents } from './webAudioEvents'
import { resetWebDuration, writeWebDuration } from './webDurationWriter'
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
    if (this.audioInstance) this.audioInstance.pause()
    this.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  private flushProgressAtCurrentTime = (): void => {
    if (!this.audioInstance) return

    const positionMs = Math.floor(this.audioInstance.currentTime * 1000)
    const sermonId = ctx.get(currentAudioAtom)?.id
    if (!sermonId) return

    const durationMs = ctx.get(durationAtom)
    void savePlaybackProgress(ctx, { durationMs, positionMs, sermonId })
    void flushHistoryProgressAction(ctx, { durationMs, positionMs, sermonId })
  }

  public setPlaybackRate = async (rate: PlaybackRate): Promise<void> => {
    this.playbackRate = rate
    if (this.audioInstance) this.audioInstance.playbackRate = rate
    void setPlaybackRateAction(ctx, rate)
  }

  public stop = async () => {
    this.flushProgressAtCurrentTime()
    this.audioInstance?.pause()
    if (this.audioInstance) this.audioInstance.currentTime = 0
    this.statusTracker.stop()
    this.state.setIsPlaying(false)
  }

  public seekTo = async (newPositionMs: number) => {
    const clampedPositionMs = Math.max(0, newPositionMs)
    if (this.audioInstance) {
      this.audioInstance.currentTime = clampedPositionMs / 1000
      this.state.setPosition(clampedPositionMs)
    }
    scheduleHistoryFlush(clampedPositionMs)
  }

  public replaceAudio = async (audioUrl: string, initialPositionMs = 0) =>
    this.loadAudio(audioUrl, initialPositionMs)

  public loadAudio = async (audioUrl: string, initialPositionMs = 0) => {
    this.state.setIsBuffering(true)
    this.statusTracker.stop()
    resetWebDuration(this.state)

    if (this.audioInstance) {
      this.detachAudioEvents?.()
      this.audioInstance.pause()
    }

    const audio = new Audio(audioUrl)
    this.audioInstance = audio

    if (this.playbackRate !== 1) audio.playbackRate = this.playbackRate

    this.detachAudioEvents = attachWebAudioEvents(audio, {
      onDuration: durationMs => writeWebDuration(this.state, durationMs),
      onEnded: () => this.onTrackEnd?.(),
      onLoaded: () => {
        this.state.setIsBuffering(false)
        if (initialPositionMs <= 0) return
        audio.currentTime = initialPositionMs / 1000
        this.state.setPosition(initialPositionMs)
      },
      onPause: () => {
        if (audio === this.audioInstance && this.state.getState().isPlaying)
          this.flushProgressAtCurrentTime()
        this.state.setIsPlaying(false)
      },
      onPlay: () => this.state.setIsPlaying(true),
      onPosition: positionMs => this.state.setPosition(positionMs),
    })
    return null
  }

  public unload = async () => {
    this.flushProgressAtCurrentTime()
    this.statusTracker.stop()
    this.detachAudioEvents?.()
    this.detachAudioEvents = null
    this.audioInstance?.pause()
    this.audioInstance = null
  }

  private audioInstance: HTMLAudioElement | null = null
  private detachAudioEvents: (() => void) | null = null
  private onTrackEnd: (() => void) | undefined = undefined
  private playbackRate: PlaybackRate = 1
  private pubsub = createPubSub()
  private state = createWebPlayerState(this.pubsub)
  private statusTracker = createStatusTracker(() => this.audioInstance, this.state)
}

export const playerService = new WebPlayerService()
