import { type AudioPlaylistStatus } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { isStalledOfflineAtom } from '../../stalledOffline'
import { playlistEngine } from './PlaylistEngine'
import { createPlaylistStatusHandler, wirePlaylistStatus } from './playlistStatusHandler'

const mockHandleQueueEnd = jest.fn().mockResolvedValue(undefined)
const mockReportPlaylistStatus = jest.fn()
const mockSyncPlaylistStatus = jest.fn()

jest.mock('./PlaylistEngine', () => ({ playlistEngine: { setCallbacks: jest.fn() } }))

jest.mock('./playlistErrorReporter', () => ({
  createPlaylistErrorReporter: () => ({
    reportStatus: (...args: unknown[]) => mockReportPlaylistStatus(...args),
  }),
}))

jest.mock('./playlistStatusSync', () => ({
  syncPlaylistStatus: (...args: unknown[]) => mockSyncPlaylistStatus(...args),
}))

jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: {
    handleQueueEnd: (...args: unknown[]) => mockHandleQueueEnd(...args),
  },
}))

const SOURCE_ERROR = 'Source error'

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

  test('closes the advance window when the freshly selected track fails', () => {
    const callbacks = createCallbacks()
    const { handleStatus, markAutoAdvanceInFlight } = createPlaylistStatusHandler(callbacks)

    handleStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()

    markAutoAdvanceInFlight()
    handleStatus(
      statusWith({ currentIndex: 1, error: { code: 2001, message: SOURCE_ERROR }, playing: false }),
    )

    expect(callbacks.onAudioInterruption.mock.calls).toEqual([[true]])
  })

  test('clears the offline stall once a loaded status reports playing', () => {
    isStalledOfflineAtom(ctx, true)
    const { handleStatus } = createPlaylistStatusHandler(createCallbacks())

    handleStatus(statusWith({ isLoaded: true, playing: false }))
    expect(ctx.get(isStalledOfflineAtom)).toBe(true)

    handleStatus(statusWith({ isLoaded: true, playing: true }))
    expect(ctx.get(isStalledOfflineAtom)).toBe(false)
  })
})

describe('wirePlaylistStatus error routing', () => {
  const wire = (isMuted = () => false) => {
    const callbacks = createCallbacks()
    jest.mocked(playlistEngine.setCallbacks).mockClear()

    wirePlaylistStatus(callbacks, isMuted)
    const wired = jest.mocked(playlistEngine.setCallbacks).mock.calls[0][0]

    return { callbacks, onStatus: wired.onStatus }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('reports a native failure and still syncs the complete status', () => {
    const { onStatus } = wire()
    const status = statusWith({ error: { code: 2001, message: SOURCE_ERROR }, playing: false })

    onStatus(status)

    expect(mockReportPlaylistStatus).toHaveBeenCalledWith(status)
    expect(mockSyncPlaylistStatus).toHaveBeenCalledWith(status)
  })

  test('raises at most one interruption edge for a failed status', () => {
    const { callbacks, onStatus } = wire()

    onStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()
    onStatus(statusWith({ error: { code: 2001, message: SOURCE_ERROR }, playing: false }))

    expect(callbacks.onAudioInterruption.mock.calls).toEqual([[true]])
  })

  test('drops every status while the stream is muted', () => {
    const { onStatus } = wire(() => true)

    onStatus(statusWith({ error: { code: 2001, message: SOURCE_ERROR } }))

    expect(mockReportPlaylistStatus).not.toHaveBeenCalled()
    expect(mockSyncPlaylistStatus).not.toHaveBeenCalled()
  })
})
