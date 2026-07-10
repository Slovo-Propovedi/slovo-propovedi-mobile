import type { PubSub } from './webPlayerPubSub'

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
    state = { ...state, ...partial }
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
