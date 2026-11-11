import { createStatusTracker } from './playerStatusTracker'
import { PLAYABLE_READY_STATE, type ResumeSeekReassert } from './resumeSeekReassert'

interface AudioStubOptions {
  currentTime?: number
  paused?: boolean
  readyState?: number
}

const createAudio = (options: AudioStubOptions = {}) =>
  ({
    currentTime: 42.5,
    paused: false,
    readyState: PLAYABLE_READY_STATE,
    ...options,
  }) as unknown as HTMLAudioElement

const createState = (isBuffering = false) => {
  let data = { duration: 0, isBuffering, isPlaying: false, position: 0 }
  return {
    getState: jest.fn(() => data),
    getStatus: jest.fn(() => ({ duration: 0, isPlaying: false, position: 0 })),
    setDuration: jest.fn((value: number) => {
      data = { ...data, duration: value }
    }),
    setIsBuffering: jest.fn((value: boolean) => {
      data = { ...data, isBuffering: value }
    }),
    setIsPlaying: jest.fn((value: boolean) => {
      data = { ...data, isPlaying: value }
    }),
    setPosition: jest.fn((value: number) => {
      data = { ...data, position: value }
    }),
  }
}

const createTracker = (options: { audio: HTMLAudioElement; isBuffering?: boolean }) => {
  const state = createState(options.isBuffering)
  const reconcile: ResumeSeekReassert = jest.fn()
  const getReconcile = jest.fn(() => reconcile)
  const tracker = createStatusTracker(() => options.audio, state, getReconcile)
  return { getReconcile, reconcile, state, tracker }
}

describe('createStatusTracker', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('clears a stuck buffering spinner once the element is playable', () => {
    const audio = createAudio()
    const { state, tracker } = createTracker({ audio, isBuffering: true })

    tracker.start()
    jest.advanceTimersByTime(500)
    tracker.stop()

    expect(state.setIsBuffering).toHaveBeenCalledWith(false)
    expect(state.setIsPlaying).toHaveBeenCalledWith(true)
    expect(state.setPosition).toHaveBeenCalledWith(42500)
  })

  test('keeps buffering while the element is not yet playable', () => {
    const audio = createAudio({ currentTime: 0, readyState: 2 })
    const { state, tracker } = createTracker({ audio, isBuffering: true })

    tracker.start()
    jest.advanceTimersByTime(500)
    tracker.stop()

    expect(state.setIsBuffering).not.toHaveBeenCalled()
  })

  test('does not touch buffering while the element is paused', () => {
    const audio = createAudio({ paused: true })
    const { state, tracker } = createTracker({ audio, isBuffering: true })

    tracker.start()
    jest.advanceTimersByTime(500)
    tracker.stop()

    expect(state.setIsBuffering).not.toHaveBeenCalled()
    expect(state.setIsPlaying).toHaveBeenCalledWith(false)
  })

  test('runs the resume-seek reassert on every tick', () => {
    const audio = createAudio()
    const { getReconcile, reconcile, tracker } = createTracker({ audio })

    tracker.start()
    jest.advanceTimersByTime(1000)
    tracker.stop()

    expect(getReconcile).toHaveBeenCalledTimes(2)
    expect(reconcile).toHaveBeenCalledTimes(2)
    expect(reconcile).toHaveBeenCalledWith(audio)
  })

  test('keeps writing isPlaying and position once per tick until stopped', () => {
    const audio = createAudio()
    const { state, tracker } = createTracker({ audio })

    tracker.start()
    jest.advanceTimersByTime(500)

    expect(state.setPosition).toHaveBeenCalledWith(42500)
    expect(state.setIsPlaying).toHaveBeenCalledWith(true)

    tracker.stop()
    jest.advanceTimersByTime(1000)

    expect(state.setPosition).toHaveBeenCalledTimes(1)
    expect(state.setIsPlaying).toHaveBeenCalledTimes(1)
  })
})
