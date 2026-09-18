export interface AudioElementLike {
  addEventListener: (type: string, handler: () => void) => void
  currentTime: number
  duration: number
  pause: () => void
  play: () => Promise<void>
  playbackRate: number
  readyState: number
  removeEventListener: (type: string, handler: () => void) => void
  src: string
}

export interface AudioElementStub {
  element: AudioElementLike
  fireEvent: (type: string) => void
  pause: jest.Mock
  play: jest.Mock
}

export const createAudioElementStub = (
  overrides: Partial<AudioElementLike> = {},
): AudioElementStub => {
  const listeners = new Map<string, Set<() => void>>()
  const pause = jest.fn()
  const play = jest.fn().mockResolvedValue(undefined)
  const addEventListener = jest.fn((type: string, handler: () => void) => {
    const set = listeners.get(type) ?? new Set<() => void>()
    set.add(handler)
    listeners.set(type, set)
  })
  const removeEventListener = jest.fn((type: string, handler: () => void) => {
    listeners.get(type)?.delete(handler)
  })
  const element: AudioElementLike = {
    addEventListener,
    currentTime: 0,
    duration: 0,
    pause,
    play,
    playbackRate: 1,
    readyState: 4,
    removeEventListener,
    src: '',
    ...overrides,
  }
  const fireEvent = (type: string) => {
    listeners.get(type)?.forEach(handler => handler())
  }
  return { element, fireEvent, pause, play }
}

export const audioStubs: AudioElementStub[] = []

export const installGlobalAudioStub = () => {
  ;(global as { Audio: unknown }).Audio = jest.fn(() => {
    const stub = createAudioElementStub()
    audioStubs.push(stub)
    return stub.element
  })
}

export const removeGlobalAudioStub = () => {
  delete (global as { Audio?: unknown }).Audio
}

interface WebPlayerServiceLike {
  pause: () => Promise<unknown>
  unload: () => Promise<unknown>
}

export const setupWebPlayerTest = async (playerService: WebPlayerServiceLike) => {
  audioStubs.length = 0
  installGlobalAudioStub()
  await playerService.unload()
  await playerService.pause()
  jest.clearAllMocks()
}
