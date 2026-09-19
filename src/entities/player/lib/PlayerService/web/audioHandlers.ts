import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import type { WebMediaSession } from './mediaSession'
import type { WebPlayerState } from './playerState'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { attachWebAudioEvents } from './audioEvents'
import { writeWebDuration } from './durationWriter'

export const reportPlayError = (error: unknown) => {
  console.error('[WebPlayerService] play failed:', error)
  reportError(error, 'Ошибка при воспроизведении аудио')
}

interface WebAudioHandlerDeps {
  audio: HTMLAudioElement
  flushProgressAtCurrentTime: () => void
  initialPositionMs: number
  isCurrentAudio: (audio: HTMLAudioElement) => boolean
  mediaSession: WebMediaSession
  noteLivePosition: (ms: number) => void
  onTrackEnd: (() => void) | undefined
  restoreInterruptedPosition: (audio: HTMLAudioElement) => boolean
  startStatusTracker: () => void
  state: WebPlayerState
  stopStatusTracker: () => void
}

export const attachWebAudioHandlers = (deps: WebAudioHandlerDeps): (() => void) => {
  let initialPositionApplied = false

  return attachWebAudioEvents(deps.audio, {
    onDuration: (durationMs: number) => writeWebDuration(deps.state, durationMs),
    onDurationChange: () => deps.mediaSession.updatePositionState(),
    onEnded: () => deps.onTrackEnd?.(),
    onError: () => {
      if (!deps.isCurrentAudio(deps.audio)) return
      deps.state.setIsPlaying(false)
      // A stream error while buffering is the web analog of the native stall:
      // remember it so the reconnect heal can auto-resume (Issue #109). The
      // online signal may lag the underrun, so buffering is the discriminator.
      if (deps.state.getState().isBuffering) void setIsStalledOfflineAction(ctx, true)
    },
    onLoaded: () => {
      deps.state.setIsBuffering(false)
      if (initialPositionApplied || deps.initialPositionMs <= 0) return
      initialPositionApplied = true
      deps.audio.currentTime = deps.initialPositionMs / 1000
      deps.state.setPosition(deps.initialPositionMs)
    },
    onPause: () => {
      deps.stopStatusTracker()
      if (deps.isCurrentAudio(deps.audio) && deps.state.getState().isPlaying)
        deps.flushProgressAtCurrentTime()
      deps.state.setIsPlaying(false)
      deps.mediaSession.updatePlaybackState()
      deps.mediaSession.updatePositionState()
    },
    onPlay: () => {
      deps.startStatusTracker()
      deps.restoreInterruptedPosition(deps.audio)
      deps.mediaSession.reassert()
      deps.state.setIsPlaying(true)
      deps.mediaSession.updatePlaybackState()
      deps.mediaSession.updatePositionState()
    },
    onPlaying: () => {
      deps.state.setIsBuffering(false)
      void setIsStalledOfflineAction(ctx, false)
    },
    onPosition: (positionMs: number) => {
      deps.noteLivePosition(positionMs)
      deps.state.setPosition(positionMs)
      deps.mediaSession.updatePositionState()
    },
    onWaiting: () => deps.state.setIsBuffering(true),
  })
}
