import {
  createResumeSeekReassert,
  PLAYABLE_READY_STATE,
  type ResumeSeekReassert,
} from './resumeSeekReassert'

const RESUME_POSITION_MS = 120000
const RESUME_POSITION_SECONDS = RESUME_POSITION_MS / 1000

interface AudioStub {
  currentTime: number
  readyState: number
}

const createAudio = (currentTime: number, readyState: number): AudioStub => ({
  currentTime,
  readyState,
})

const reassertOn = (reassert: ResumeSeekReassert, audio: AudioStub) =>
  reassert(audio as unknown as HTMLAudioElement)

const createState = () => ({ setPosition: jest.fn() })

const createMediaSession = () => ({ updatePositionState: jest.fn() })

const createReassert = (initialPositionMs: number) => {
  const state = createState()
  const mediaSession = createMediaSession()
  const reassert = createResumeSeekReassert(initialPositionMs, state, mediaSession)
  return { mediaSession, reassert, state }
}

describe('createResumeSeekReassert', () => {
  test('re-applies the stored position once the element is playable', () => {
    const { mediaSession, reassert, state } = createReassert(RESUME_POSITION_MS)
    const audio = createAudio(0, PLAYABLE_READY_STATE)

    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(RESUME_POSITION_SECONDS)
    expect(state.setPosition).toHaveBeenCalledWith(RESUME_POSITION_MS)
    expect(mediaSession.updatePositionState).toHaveBeenCalledTimes(1)
  })

  test('does not consume the one-shot below HAVE_FUTURE_DATA', () => {
    const { reassert, state } = createReassert(RESUME_POSITION_MS)
    const audio = createAudio(0, 1)

    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(0)
    expect(state.setPosition).not.toHaveBeenCalled()

    audio.readyState = PLAYABLE_READY_STATE
    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(RESUME_POSITION_SECONDS)
    expect(state.setPosition).toHaveBeenCalledWith(RESUME_POSITION_MS)
  })

  test('reasserts only once per element', () => {
    const { reassert, state } = createReassert(RESUME_POSITION_MS)
    const audio = createAudio(0, PLAYABLE_READY_STATE)

    reassertOn(reassert, audio)
    audio.currentTime = 5
    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(5)
    expect(state.setPosition).toHaveBeenCalledTimes(1)
  })

  test('never seeks without a stored resume position', () => {
    const { mediaSession, reassert, state } = createReassert(0)
    const audio = createAudio(5, PLAYABLE_READY_STATE)

    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(5)
    expect(state.setPosition).not.toHaveBeenCalled()
    expect(mediaSession.updatePositionState).not.toHaveBeenCalled()
  })

  test('consumes the one-shot without seeking when already at the stored position', () => {
    const { reassert, state } = createReassert(RESUME_POSITION_MS)
    const audio = createAudio(119.5, PLAYABLE_READY_STATE)

    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(119.5)
    expect(state.setPosition).not.toHaveBeenCalled()

    audio.currentTime = 0
    reassertOn(reassert, audio)

    expect(audio.currentTime).toBe(0)
  })

  test('exposes HAVE_FUTURE_DATA as the playable readyState threshold', () => {
    expect(PLAYABLE_READY_STATE).toBe(3)
  })
})
