export interface PubSub {
  notify: () => void
  subscribe: (listener: StateListener) => () => void
}

type StateListener = () => void

export const createPubSub = (): PubSub => {
  const listeners: Set<StateListener> = new Set()

  return {
    notify: () => {
      listeners.forEach(listener => listener())
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
