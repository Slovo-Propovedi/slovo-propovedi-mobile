import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { attachWebAudioHandlers, reportPlayError } from './audioHandlers'
import {
  createResumeSeekReassert,
  PLAYABLE_READY_STATE,
  type ResumeSeekReassert,
} from './resumeSeekReassert'

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('../../stalledOffline', () => ({ setIsStalledOfflineAction: jest.fn() }))

const errorNamed = (name: string): Error => Object.assign(new Error(name), { name })

const RESUME_POSITION_MS = 120000
const RESUME_POSITION_SECONDS = RESUME_POSITION_MS / 1000

interface AudioElementStub {
  element: HTMLAudioElement
  fireEvent: (type: string) => void
}

const createElementStub = (): AudioElementStub => {
  const listeners = new Map<string, Set<() => void>>()
  const element = {
    addEventListener: (type: string, handler: () => void) => {
      const set = listeners.get(type) ?? new Set<() => void>()
      set.add(handler)
      listeners.set(type, set)
    },
    currentTime: 0,
    duration: 0,
    readyState: PLAYABLE_READY_STATE,
    removeEventListener: (type: string, handler: () => void) => {
      listeners.get(type)?.delete(handler)
    },
  }
  const fireEvent = (type: string) => listeners.get(type)?.forEach(handler => handler())
  return { element: element as unknown as HTMLAudioElement, fireEvent }
}

const createState = (isBuffering = false) => ({
  getState: jest.fn(() => ({ duration: 0, isBuffering, isPlaying: false, position: 0 })),
  getStatus: jest.fn(() => ({ duration: 0, isPlaying: false, position: 0 })),
  setDuration: jest.fn(),
  setIsBuffering: jest.fn(),
  setIsPlaying: jest.fn(),
  setPosition: jest.fn(),
})

const createDeps = (
  audio: HTMLAudioElement,
  state: ReturnType<typeof createState>,
  initialPositionMs = 0,
  resumeSeekReassert: ResumeSeekReassert = jest.fn(),
) => ({
  audio,
  flushProgressAtCurrentTime: jest.fn(),
  initialPositionMs,
  isCurrentAudio: () => true,
  mediaSession: {
    clear: jest.fn(),
    reassert: jest.fn(),
    reassertMetadata: jest.fn(),
    setMetadata: jest.fn(),
    updatePlaybackState: jest.fn(),
    updatePositionState: jest.fn(),
  },
  noteLivePosition: jest.fn(),
  restoreInterruptedPosition: () => false,
  resumeSeekReassert,
  startStatusTracker: jest.fn(),
  state,
  stopStatusTracker: jest.fn(),
})

describe('reportPlayError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('downgrades AbortError to a warning without surfacing a dialog', () => {
    reportPlayError(errorNamed('AbortError'))

    expect(reportError).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith('[WebPlayerService] play aborted:', expect.anything())
  })

  test('reports an unexpected play failure', () => {
    reportPlayError(errorNamed('NotSupportedError'))

    expect(reportError).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalled()
  })
})

describe('attachWebAudioHandlers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('error while buffering arms the stall flag then clears buffering', () => {
    const state = createState(true)
    const { element, fireEvent } = createElementStub()
    attachWebAudioHandlers(createDeps(element, state))

    fireEvent('error')

    expect(state.setIsPlaying).toHaveBeenCalledWith(false)
    expect(setIsStalledOfflineAction).toHaveBeenCalledWith(ctx, true)
    expect(state.setIsBuffering).toHaveBeenCalledWith(false)
    expect(jest.mocked(setIsStalledOfflineAction).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(state.setIsBuffering).mock.invocationCallOrder[0],
    )
  })

  test('delegates the first playing edge to the injected resume-seek reassert', () => {
    const state = createState()
    const { element, fireEvent } = createElementStub()
    const resumeSeekReassert = jest.fn()
    attachWebAudioHandlers(createDeps(element, state, RESUME_POSITION_MS, resumeSeekReassert))

    fireEvent('playing')

    expect(resumeSeekReassert).toHaveBeenCalledWith(element)
  })

  test('re-asserts a dropped resume seek once on the first playing edge', () => {
    const state = createState()
    const { element, fireEvent } = createElementStub()
    const assignments: number[] = []
    let storedTime = 0
    Object.defineProperty(element, 'currentTime', {
      configurable: true,
      get: () => storedTime,
      set: (value: number) => {
        assignments.push(value)
        if (assignments.length > 1) storedTime = value
      },
    })
    const { reassert } = createResumeSeekReassert(RESUME_POSITION_MS, state, {
      updatePositionState: jest.fn(),
    })
    attachWebAudioHandlers(createDeps(element, state, RESUME_POSITION_MS, reassert))

    fireEvent('loadedmetadata')
    jest.mocked(state.setPosition).mockClear()
    fireEvent('playing')

    expect(assignments).toEqual([RESUME_POSITION_SECONDS, RESUME_POSITION_SECONDS])
    expect(state.setPosition).toHaveBeenCalledWith(RESUME_POSITION_MS)
  })

  test('keeps a seek that landed on loadedmetadata and does not fight it', () => {
    const state = createState()
    const { element, fireEvent } = createElementStub()
    const assignments: number[] = []
    let storedTime = 0
    Object.defineProperty(element, 'currentTime', {
      configurable: true,
      get: () => storedTime,
      set: (value: number) => {
        assignments.push(value)
        storedTime = value
      },
    })
    const { reassert } = createResumeSeekReassert(RESUME_POSITION_MS, state, {
      updatePositionState: jest.fn(),
    })
    attachWebAudioHandlers(createDeps(element, state, RESUME_POSITION_MS, reassert))

    fireEvent('loadedmetadata')
    jest.mocked(state.setPosition).mockClear()
    fireEvent('playing')

    expect(assignments).toEqual([RESUME_POSITION_SECONDS])
    expect(state.setPosition).not.toHaveBeenCalled()
  })
})
