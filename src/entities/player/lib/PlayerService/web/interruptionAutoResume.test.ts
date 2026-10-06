import { reportError } from 'shared/model/error-dialog'
import { resumeInterruptedPlayback } from './interruptionAutoResume'

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

interface AudioLike {
  ended: boolean
  paused: boolean
  play: jest.Mock
}

const createAudio = (overrides: Partial<AudioLike> = {}): AudioLike => ({
  ended: false,
  paused: true,
  play: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

const asAudio = (audio: AudioLike) => audio as unknown as HTMLAudioElement

const errorNamed = (name: string): Error => Object.assign(new Error(name), { name })

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('resumeInterruptedPlayback', () => {
  test('does nothing without a captured play intent', () => {
    const audio = createAudio()

    resumeInterruptedPlayback(asAudio(audio), () => false)

    expect(audio.play).not.toHaveBeenCalled()
  })

  test('does nothing when the element is not paused', () => {
    const audio = createAudio({ paused: false })

    resumeInterruptedPlayback(asAudio(audio), () => true)

    expect(audio.play).not.toHaveBeenCalled()
  })

  test('does not replay a naturally finished track', () => {
    const audio = createAudio({ ended: true })

    resumeInterruptedPlayback(asAudio(audio), () => true)

    expect(audio.play).not.toHaveBeenCalled()
  })

  test('plays when playback was interrupted while playing', () => {
    const audio = createAudio()

    resumeInterruptedPlayback(asAudio(audio), () => true)

    expect(audio.play).toHaveBeenCalledTimes(1)
  })

  test('NotAllowedError keeps the element paused without retry', async () => {
    const audio = createAudio({
      play: jest.fn().mockRejectedValue(errorNamed('NotAllowedError')),
    })

    resumeInterruptedPlayback(asAudio(audio), () => true)
    await jest.advanceTimersByTimeAsync(1000)

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledTimes(1)
  })

  test('AbortError triggers a single short retry', async () => {
    const play = jest
      .fn()
      .mockRejectedValueOnce(errorNamed('AbortError'))
      .mockResolvedValueOnce(undefined)
    const audio = createAudio({ play })

    resumeInterruptedPlayback(asAudio(audio), () => true)
    await jest.advanceTimersByTimeAsync(0)
    expect(play).toHaveBeenCalledTimes(1)

    await jest.advanceTimersByTimeAsync(100)
    expect(play).toHaveBeenCalledTimes(2)
    expect(reportError).not.toHaveBeenCalled()
  })

  test('a repeated AbortError stops after one retry and is reported', async () => {
    const play = jest.fn().mockRejectedValue(errorNamed('AbortError'))
    const audio = createAudio({ play })

    resumeInterruptedPlayback(asAudio(audio), () => true)
    await jest.advanceTimersByTimeAsync(1000)

    expect(play).toHaveBeenCalledTimes(2)
    expect(reportError).toHaveBeenCalledTimes(1)
  })

  test('an unexpected rejection is reported', async () => {
    const audio = createAudio({ play: jest.fn().mockRejectedValue(errorNamed('Oops')) })

    resumeInterruptedPlayback(asAudio(audio), () => true)
    await jest.advanceTimersByTimeAsync(0)

    expect(reportError).toHaveBeenCalledTimes(1)
  })
})
