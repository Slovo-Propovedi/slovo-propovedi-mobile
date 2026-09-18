import { createInterruptionResume, RESUME_GUARD_MIN_MS } from './webInterruptionResume'

interface AudioLike {
  addEventListener: jest.Mock
  currentTime: number
  readyState: number
  removeEventListener: jest.Mock
}

const createAudio = (overrides: Partial<AudioLike> = {}): AudioLike => ({
  addEventListener: jest.fn(),
  currentTime: 0,
  readyState: 4,
  removeEventListener: jest.fn(),
  ...overrides,
})

const createDeps = () => ({
  mediaSession: { updatePositionState: jest.fn() },
  state: { setPosition: jest.fn() },
})

const asAudio = (audio: AudioLike) => audio as unknown as HTMLAudioElement

describe('createInterruptionResume', () => {
  test('maybeRestore returns false when the snapshot is at or below the guard threshold', () => {
    const deps = createDeps()
    const resume = createInterruptionResume(deps)
    const audio = createAudio()

    resume.reset(RESUME_GUARD_MIN_MS)
    expect(resume.maybeRestore(asAudio(audio))).toBe(false)

    resume.reset(0)
    expect(resume.maybeRestore(asAudio(audio))).toBe(false)

    expect(audio.currentTime).toBe(0)
    expect(deps.state.setPosition).not.toHaveBeenCalled()
  })

  test('noteLivePosition ignores values at or below the guard threshold', () => {
    const resume = createInterruptionResume(createDeps())

    resume.noteLivePosition(RESUME_GUARD_MIN_MS)
    expect(resume.getSnapshotMs()).toBe(0)

    resume.noteLivePosition(RESUME_GUARD_MIN_MS + 1)
    expect(resume.getSnapshotMs()).toBe(RESUME_GUARD_MIN_MS + 1)
  })

  test('noteExplicitPosition clamps negative values to 0', () => {
    const resume = createInterruptionResume(createDeps())

    resume.noteExplicitPosition(-5000)
    expect(resume.getSnapshotMs()).toBe(0)

    resume.noteExplicitPosition(30000)
    expect(resume.getSnapshotMs()).toBe(30000)
  })

  test('reset sets the snapshot', () => {
    const resume = createInterruptionResume(createDeps())

    resume.reset(120000)
    expect(resume.getSnapshotMs()).toBe(120000)

    resume.reset()
    expect(resume.getSnapshotMs()).toBe(0)
  })

  test('maybeRestore restores the snapshot and syncs state and media session', () => {
    const deps = createDeps()
    const resume = createInterruptionResume(deps)
    const audio = createAudio()

    resume.reset(120000)
    expect(resume.maybeRestore(asAudio(audio))).toBe(true)

    expect(audio.currentTime).toBe(120)
    expect(deps.state.setPosition).toHaveBeenCalledWith(120000)
    expect(deps.mediaSession.updatePositionState).toHaveBeenCalled()
  })

  test('maybeRestore does not restore when the element is already past the guard', () => {
    const deps = createDeps()
    const resume = createInterruptionResume(deps)
    const audio = createAudio({ currentTime: 30 })

    resume.reset(120000)
    expect(resume.maybeRestore(asAudio(audio))).toBe(false)

    expect(audio.currentTime).toBe(30)
    expect(deps.state.setPosition).not.toHaveBeenCalled()
  })

  test('applyRestore with ready metadata does not register a loadedmetadata listener', () => {
    const resume = createInterruptionResume(createDeps())
    const audio = createAudio()

    resume.applyRestore(asAudio(audio), 120000)

    expect(audio.addEventListener).not.toHaveBeenCalled()
  })

  test('applyRestore with readyState 0 re-applies the snapshot once metadata loads', () => {
    const resume = createInterruptionResume(createDeps())
    const audio = createAudio({ readyState: 0 })

    resume.applyRestore(asAudio(audio), 120000)
    expect(audio.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function))

    const [, listener] = audio.addEventListener.mock.calls[0]
    audio.currentTime = 0
    listener()

    expect(audio.currentTime).toBe(120)
    expect(audio.removeEventListener).toHaveBeenCalledWith('loadedmetadata', listener)
  })

  test('applyRestore leaves a position the browser already moved past the guard', () => {
    const resume = createInterruptionResume(createDeps())
    const audio = createAudio({ readyState: 0 })

    resume.applyRestore(asAudio(audio), 120000)
    const [, listener] = audio.addEventListener.mock.calls[0]

    audio.currentTime = 5
    listener()

    expect(audio.currentTime).toBe(5)
  })
})
