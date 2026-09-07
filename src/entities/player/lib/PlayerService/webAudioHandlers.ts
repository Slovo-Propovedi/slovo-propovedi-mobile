import type { WebMediaSession } from './webMediaSession'
import type { WebPlayerState } from './webPlayerState'
import { attachWebAudioEvents } from './webAudioEvents'
import { writeWebDuration } from './webDurationWriter'

interface WebAudioHandlerDeps {
  audio: HTMLAudioElement
  flushProgressAtCurrentTime: () => void
  initialPositionMs: number
  isCurrentAudio: (audio: HTMLAudioElement) => boolean
  mediaSession: WebMediaSession
  onTrackEnd: (() => void) | undefined
  state: WebPlayerState
}

export const attachWebAudioHandlers = (deps: WebAudioHandlerDeps): (() => void) =>
  attachWebAudioEvents(deps.audio, {
    onDuration: (durationMs: number) => writeWebDuration(deps.state, durationMs),
    onDurationChange: () => deps.mediaSession.updatePositionState(),
    onEnded: () => deps.onTrackEnd?.(),
    onLoaded: () => {
      deps.state.setIsBuffering(false)
      if (deps.initialPositionMs <= 0) return
      deps.audio.currentTime = deps.initialPositionMs / 1000
      deps.state.setPosition(deps.initialPositionMs)
    },
    onPause: () => {
      if (deps.isCurrentAudio(deps.audio) && deps.state.getState().isPlaying)
        deps.flushProgressAtCurrentTime()
      deps.state.setIsPlaying(false)
      deps.mediaSession.updatePlaybackState()
      deps.mediaSession.updatePositionState()
    },
    onPlay: () => {
      deps.state.setIsPlaying(true)
      deps.mediaSession.updatePlaybackState()
      deps.mediaSession.updatePositionState()
    },
    onPosition: (positionMs: number) => {
      deps.state.setPosition(positionMs)
      deps.mediaSession.updatePositionState()
    },
  })
