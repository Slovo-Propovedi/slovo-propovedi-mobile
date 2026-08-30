import { type AudioPlayer, type AudioStatus } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { isSeekingAtom, pauseTypeAtom, positionAtom, seekTargetPositionAtom } from '../../model'
import { createAudioInterruptionHandler, setupPlayerListeners } from './nativePlayerHelpers'

type StatusUpdateHandler = (status: AudioStatus) => void

const createPlayerStub = (): AudioPlayer =>
  ({ addListener: jest.fn(() => ({ remove: jest.fn() })) }) as unknown as AudioPlayer

const getPlaybackStatusHandler = (player: AudioPlayer): StatusUpdateHandler => {
  const handler = jest.mocked(player.addListener).mock.calls[1][1]
  return handler as StatusUpdateHandler
}

const statusWith = (overrides: Partial<AudioStatus>): AudioStatus =>
  ({
    currentTime: 60,
    didJustFinish: false,
    duration: 120,
    isBuffering: false,
    isLoaded: true,
    playing: false,
    ...overrides,
  }) as AudioStatus

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('setupPlayerListeners position sync during seek', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    positionAtom(ctx, 0)
    isSeekingAtom(ctx, false)
    seekTargetPositionAtom(ctx, null)
  })

  test('native position does not overwrite positionAtom while seeking', async () => {
    const player = createPlayerStub()
    setupPlayerListeners(player, jest.fn())
    const handler = getPlaybackStatusHandler(player)

    positionAtom(ctx, 60000)
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)

    handler(statusWith({ currentTime: 30 }))
    await flushMicrotasks()

    expect(ctx.get(positionAtom)).toBe(60000)
    expect(ctx.get(isSeekingAtom)).toBe(true)
  })

  test('clears seeking flag when native position confirms the target', async () => {
    const player = createPlayerStub()
    setupPlayerListeners(player, jest.fn())
    const handler = getPlaybackStatusHandler(player)

    positionAtom(ctx, 60000)
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)

    handler(statusWith({ currentTime: 59.8 }))
    await flushMicrotasks()

    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(positionAtom)).toBe(60000)
  })

  test('keeps seeking flag when native position is far from target', async () => {
    const player = createPlayerStub()
    setupPlayerListeners(player, jest.fn())
    const handler = getPlaybackStatusHandler(player)

    positionAtom(ctx, 60000)
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)

    handler(statusWith({ currentTime: 30 }))
    await flushMicrotasks()

    expect(ctx.get(isSeekingAtom)).toBe(true)
  })

  test('updates positionAtom normally when not seeking', async () => {
    const player = createPlayerStub()
    setupPlayerListeners(player, jest.fn())
    const handler = getPlaybackStatusHandler(player)

    isSeekingAtom(ctx, false)

    handler(statusWith({ currentTime: 42 }))
    await flushMicrotasks()

    expect(ctx.get(positionAtom)).toBe(42000)
  })
})

describe('createAudioInterruptionHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    pauseTypeAtom(ctx, null)
  })

  test('pauses with auto type on the interruption edge', () => {
    const pause = jest.fn().mockResolvedValue(undefined)
    const play = jest.fn().mockResolvedValue(undefined)
    const handler = createAudioInterruptionHandler({ pause, play })

    handler(true)

    expect(pause).toHaveBeenCalledWith('auto')
    expect(play).not.toHaveBeenCalled()
  })

  test('resumes on interruption end when pauseType is auto and stored flag set', () => {
    const pause = jest.fn().mockResolvedValue(undefined)
    const play = jest.fn().mockResolvedValue(undefined)
    const handler = createAudioInterruptionHandler({ pause, play })

    handler(true)
    pauseTypeAtom(ctx, 'auto')
    handler(false)

    expect(play).toHaveBeenCalled()
  })
})
