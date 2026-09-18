import type { WebMediaSession } from './mediaSession'
import type { WebPlayerState } from './playerState'
import { attachWebAudioEvents } from './audioEvents'
import { writeWebDuration } from './durationWriter'

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
    onPosition: (positionMs: number) => {
      deps.noteLivePosition(positionMs)
      deps.state.setPosition(positionMs)
      deps.mediaSession.updatePositionState()
    },
  })
}
