import { type AudioPlaylistStatus } from 'expo-audio'
import { createPlaylistStatusHandler } from './playlistStatusHandler'

const mockHandleQueueEnd = jest.fn().mockResolvedValue(undefined)
const mockSyncPlaylistStatus = jest.fn()

jest.mock('./PlaylistEngine', () => ({ playlistEngine: { setCallbacks: jest.fn() } }))

jest.mock('./playlistStatusSync', () => ({
  syncPlaylistStatus: (...args: unknown[]) => mockSyncPlaylistStatus(...args),
}))

jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: {
    handleQueueEnd: (...args: unknown[]) => mockHandleQueueEnd(...args),
  },
}))

const statusWith = (overrides: Partial<AudioPlaylistStatus>): AudioPlaylistStatus =>
  ({
    currentIndex: 0,
    currentTime: 60,
    didJustFinish: false,
    duration: 120,
    id: 'playlist-1',
    isBuffering: false,
    isLoaded: true,
    loop: 'none',
    muted: false,
    playbackRate: 1,
    playing: true,
    trackCount: 2,
    volume: 1,
    ...overrides,
  }) as AudioPlaylistStatus

const createCallbacks = () => ({ onAudioInterruption: jest.fn() })

describe('createPlaylistStatusHandler queue end', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('handles a genuine didJustFinish exactly once', () => {
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())

    handleStatus(statusWith({ currentTime: 60 }))
    handleStatus(statusWith({ currentTime: 120, didJustFinish: true }))
    handleStatus(statusWith({ currentTime: 120, didJustFinish: true }))

    expect(mockHandleQueueEnd).toHaveBeenCalledTimes(1)
  })

  test('does not handle a didJustFinish before a healthy status armed the listener', () => {
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())

    handleStatus(statusWith({ currentTime: 120, didJustFinish: true, isLoaded: false }))

    expect(mockHandleQueueEnd).not.toHaveBeenCalled()
  })

  test('ignores a stale didJustFinish fired right after a track change', () => {
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())

    handleStatus(statusWith({ currentIndex: 1, currentTime: 0 }))
    handleStatus(
      statusWith({ currentIndex: 1, currentTime: 10, didJustFinish: true, duration: 120 }),
    )

    expect(mockHandleQueueEnd).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalled()
  })

  test('re-arms the queue-end guard after the track changes', () => {
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())

    handleStatus(statusWith({ currentIndex: 0, currentTime: 60 }))
    handleStatus(statusWith({ currentIndex: 0, currentTime: 120, didJustFinish: true }))
    handleStatus(statusWith({ currentIndex: 1, currentTime: 0 }))
    handleStatus(statusWith({ currentIndex: 1, currentTime: 120, didJustFinish: true }))

    expect(mockHandleQueueEnd).toHaveBeenCalledTimes(2)
  })
})

describe('createPlaylistStatusHandler interruption edges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('reports playing→false as an interruption and false→true as its end', () => {
    const callbacks = createCallbacks()
    const { handleStatus } = createPlaylistStatusHandler(callbacks)

    handleStatus(statusWith({ playing: true }))
    handleStatus(statusWith({ playing: false }))
    handleStatus(statusWith({ playing: true }))

    expect(callbacks.onAudioInterruption.mock.calls).toEqual([[false], [true], [false]])
  })

  test('mirrors every status into the atom sync', () => {
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())
    const status = statusWith({ currentTime: 42 })

    handleStatus(status)

    expect(mockSyncPlaylistStatus).toHaveBeenCalledWith(status)
  })
})
