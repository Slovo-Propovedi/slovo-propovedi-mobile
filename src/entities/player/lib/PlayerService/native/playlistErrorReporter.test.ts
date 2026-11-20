import { type AudioPlaylistStatus } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { isStalledOfflineAtom } from '../../stalledOffline'
import { createPlaylistErrorReporter } from './playlistErrorReporter'

const mockReportPlaybackError = jest.fn()

jest.mock('./reportPlaybackError', () => ({
  reportPlaybackError: (...args: unknown[]) => mockReportPlaybackError(...args),
}))

const statusWith = (overrides: Partial<AudioPlaylistStatus>): AudioPlaylistStatus => ({
  currentIndex: 0,
  currentTime: 0,
  didJustFinish: false,
  duration: 120,
  id: 'playlist-1',
  isBuffering: false,
  isLoaded: false,
  loop: 'none',
  muted: false,
  playbackRate: 1,
  playing: false,
  trackCount: 3,
  volume: 1,
  ...overrides,
})

const errorStatus = (overrides: Partial<AudioPlaylistStatus> = {}): AudioPlaylistStatus =>
  statusWith({ error: { code: 2001, message: 'Source error' }, ...overrides })

describe('createPlaylistErrorReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isStalledOfflineAtom(ctx, false)
  })

  test('reports the native failure once for repeated statuses of the same track', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus())
    reportStatus(errorStatus())
    reportStatus(errorStatus())

    expect(mockReportPlaybackError).toHaveBeenCalledTimes(1)
    expect(mockReportPlaybackError).toHaveBeenCalledWith('Source error')
  })

  test('reports again once the failure lands on a different track', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus({ currentIndex: 0 }))
    reportStatus(errorStatus({ currentIndex: 1 }))

    expect(mockReportPlaybackError).toHaveBeenCalledTimes(2)
  })

  test('reports again when a new error kind arrives on the same track', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus())
    reportStatus(errorStatus({ error: { code: 2003, message: 'Decoder failed' } }))

    expect(mockReportPlaybackError).toHaveBeenCalledTimes(2)
    expect(mockReportPlaybackError).toHaveBeenLastCalledWith('Decoder failed')
  })

  test('describes a message-less failure by its error code', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus({ error: { code: 2001, message: null } }))

    expect(mockReportPlaybackError).toHaveBeenCalledWith('PlaybackException 2001')
  })

  test('flags the stall so the reconnect heal can pick the stream up', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus())

    expect(ctx.get(isStalledOfflineAtom)).toBe(true)
  })

  test('reports the same failure again after a recovery cycle', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(errorStatus())
    reportStatus(statusWith({ isLoaded: true, playing: true }))
    reportStatus(errorStatus())

    expect(mockReportPlaybackError).toHaveBeenCalledTimes(2)
    expect(ctx.get(isStalledOfflineAtom)).toBe(true)
  })

  test('ignores a regular status without an error', () => {
    const { reportStatus } = createPlaylistErrorReporter()

    reportStatus(statusWith({ isLoaded: true, playing: true }))

    expect(mockReportPlaybackError).not.toHaveBeenCalled()
    expect(ctx.get(isStalledOfflineAtom)).toBe(false)
  })
})
