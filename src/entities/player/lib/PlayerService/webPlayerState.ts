import { ctx } from 'shared/lib/reatom-ctx'
import type { PubSub } from './webPlayerPubSub'
import { setIsBufferingAction, setIsPlayingAction, setPositionAction } from '../../model'

export interface WebPlayerState {
  getState: () => WebPlayerStateData
  setDuration: (value: number) => void
  setIsBuffering: (value: boolean) => void
  setIsPlaying: (value: boolean) => void
  setPosition: (value: number) => void
}

export interface WebPlayerStateData {
  duration: number
  isBuffering: boolean
  isPlaying: boolean
  position: number
}

export const createWebPlayerState = (pubsub: PubSub): WebPlayerState => {
  let state: WebPlayerStateData = {
    duration: 0,
    isBuffering: false,
    isPlaying: false,
    position: 0,
  }

  const update = (partial: Partial<WebPlayerStateData>) => {
    const previous = state
    state = { ...state, ...partial }
    // Mirror to the shared Reatom atoms the UI reads (usePlayerState). The native
    // PlayerService does the equivalent through its expo-audio status listeners;
    // duration stays owned by webDurationWriter.
    if (state.isPlaying !== previous.isPlaying) void setIsPlayingAction(ctx, state.isPlaying)
    if (state.isBuffering !== previous.isBuffering)
      void setIsBufferingAction(ctx, state.isBuffering)
    if (state.position !== previous.position) void setPositionAction(ctx, state.position)
    pubsub.notify()
  }

  return {
    getState: () => ({ ...state }),
    setDuration: value => update({ duration: value }),
    setIsBuffering: value => update({ isBuffering: value }),
    setIsPlaying: value => update({ isPlaying: value }),
    setPosition: value => update({ position: value }),
  }
}
