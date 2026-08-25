import type { StatusCallbacks } from './types'
import type { AudioPlayer, AudioStatus } from 'expo-audio'
import { playerStatusListener } from './PlayerStatusListener'

type StatusUpdateHandler = (status: AudioStatus) => void

const createPlayerStub = (): AudioPlayer =>
  ({ addListener: jest.fn(() => ({ remove: jest.fn() })) }) as unknown as AudioPlayer

const createCallbacks = (): StatusCallbacks => ({
  onAudioInterruption: jest.fn(),
  onBufferingChange: jest.fn(),
  onDurationChange: jest.fn(),
  onPlayingChange: jest.fn(),
  onPositionChange: jest.fn(),
  onTrackEnd: jest.fn(),
})

const getStatusHandler = (player: AudioPlayer, subscriptionIndex: number): StatusUpdateHandler => {
  const handler = jest.mocked(player.addListener).mock.calls[subscriptionIndex][1]
  return handler as StatusUpdateHandler
}

const getTrackEndHandler = (player: AudioPlayer): StatusUpdateHandler => getStatusHandler(player, 0)

const getPlaybackStatusHandler = (player: AudioPlayer): StatusUpdateHandler =>
  getStatusHandler(player, 1)

const statusWith = (overrides: Partial<AudioStatus>): AudioStatus =>
  ({
    currentTime: 60,
    didJustFinish: true,
    duration: 120,
    isBuffering: false,
    isLoaded: true,
    playing: false,
    ...overrides,
  }) as AudioStatus

// Emulates the first healthy status tick of a freshly loaded source —
// the event that arms the didJustFinish handler
const armListener = (player: AudioPlayer): void => {
  getPlaybackStatusHandler(player)(statusWith({ currentTime: 0, didJustFinish: false }))
}

describe('PlayerStatusListener track end', () => {
  let consoleWarnSpy: jest.SpyInstance
  let player: AudioPlayer
  let callbacks: StatusCallbacks
  let onTrackEnd: StatusUpdateHandler

  beforeEach(() => {
    jest.clearAllMocks()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    player = createPlayerStub()
    callbacks = createCallbacks()
    playerStatusListener.setupListeners(player, callbacks)
    onTrackEnd = getTrackEndHandler(player)
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  test('ignores didJustFinish fired before the listener is armed', () => {
    onTrackEnd(statusWith({ currentTime: 119.5, duration: 120 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('ignores an unarmed stale event even with unknown duration (double-advance hole)', () => {
    onTrackEnd(statusWith({ currentTime: 42, duration: 0 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('arms on the first healthy status update and handles a subsequent genuine track end', () => {
    armListener(player)
    onTrackEnd(statusWith({ currentTime: 119.5, duration: 120 }))

    expect(callbacks.onTrackEnd).toHaveBeenCalledTimes(1)
  })

  test('does not arm on a status update with unknown duration', () => {
    getPlaybackStatusHandler(player)(
      statusWith({ currentTime: 0, didJustFinish: false, duration: 0 }),
    )
    onTrackEnd(statusWith({ currentTime: 42, duration: 0 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('does not arm on a status update that already reports didJustFinish', () => {
    getPlaybackStatusHandler(player)(statusWith({ currentTime: 120, duration: 120 }))
    onTrackEnd(statusWith({ currentTime: 120, duration: 120 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('cleanup() disarms the listener again', () => {
    armListener(player)
    playerStatusListener.cleanup()
    playerStatusListener.setupListeners(player, callbacks)

    onTrackEnd(statusWith({ currentTime: 119.5, duration: 120 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('cleanup() resets the stale-event warning so it can fire once per track again', () => {
    const staleEvent = statusWith({ currentTime: 10, duration: 120 })

    armListener(player)
    onTrackEnd(staleEvent)
    playerStatusListener.cleanup()
    playerStatusListener.setupListeners(player, callbacks)
    armListener(player)
    onTrackEnd(staleEvent)

    const staleWarnings = consoleWarnSpy.mock.calls.filter(
      ([msg]) => typeof msg === 'string' && msg.includes('Ignored stale didJustFinish event'),
    )
    expect(staleWarnings).toHaveLength(2)
  })

  test('ignores a stale didJustFinish fired right after a source change (expo-audio #34301)', () => {
    armListener(player)
    onTrackEnd(statusWith({ currentTime: 60, duration: 120 }))

    expect(callbacks.onTrackEnd).not.toHaveBeenCalled()
  })

  test('handles a genuine track end (position within tolerance of duration)', () => {
    armListener(player)
    onTrackEnd(statusWith({ currentTime: 119.5, duration: 120 }))

    expect(callbacks.onTrackEnd).toHaveBeenCalledTimes(1)
  })

  test('treats an unknown duration as a genuine track end', () => {
    armListener(player)
    onTrackEnd(statusWith({ currentTime: 42, duration: 0 }))

    expect(callbacks.onTrackEnd).toHaveBeenCalledTimes(1)
  })

  test('handles the track end exactly once despite duplicate events', () => {
    armListener(player)
    const genuineEnd = statusWith({ currentTime: 119.9, duration: 120 })

    onTrackEnd(genuineEnd)
    onTrackEnd(genuineEnd)

    expect(callbacks.onTrackEnd).toHaveBeenCalledTimes(1)
  })

  test('warns about stale events only once per track', () => {
    armListener(player)
    onTrackEnd(statusWith({ currentTime: 10, duration: 120 }))
    onTrackEnd(statusWith({ currentTime: 20, duration: 120 }))

    const staleWarnings = consoleWarnSpy.mock.calls.filter(
      ([msg]) => typeof msg === 'string' && msg.includes('Ignored stale didJustFinish event'),
    )
    expect(staleWarnings).toHaveLength(1)
  })
})
