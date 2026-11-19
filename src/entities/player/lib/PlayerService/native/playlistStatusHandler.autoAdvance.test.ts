import { type AudioPlaylistStatus } from 'expo-audio'
import { playlistEngine } from './PlaylistEngine'
import { createPlaylistStatusHandler, wirePlaylistStatus } from './playlistStatusHandler'

jest.mock('./PlaylistEngine', () => ({ playlistEngine: { setCallbacks: jest.fn() } }))

jest.mock('./playlistStatusSync', () => ({ syncPlaylistStatus: jest.fn() }))

jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: {
    handleQueueEnd: jest.fn().mockResolvedValue(undefined),
    handleTrackChanged: jest.fn().mockResolvedValue(undefined),
  },
}))

const statusWith = (overrides: Partial<AudioPlaylistStatus>): AudioPlaylistStatus =>
  ({
    currentIndex: 0,
    currentTime: 1,
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

describe('createPlaylistStatusHandler native auto-advance window', () => {
  const setup = () => {
    const callbacks = { onAudioInterruption: jest.fn() }
    const { handleStatus, markAutoAdvanceInFlight } = createPlaylistStatusHandler(callbacks)

    return { callbacks, handleStatus, markAutoAdvanceInFlight }
  }

  test('suppresses the playing→false edge of a native auto-advance', () => {
    const { callbacks, handleStatus, markAutoAdvanceInFlight } = setup()

    handleStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()

    markAutoAdvanceInFlight()
    handleStatus(statusWith({ currentIndex: 1, playing: false }))

    expect(callbacks.onAudioInterruption).not.toHaveBeenCalled()
  })

  test('still reports a playing→false edge without an auto-advance in flight', () => {
    const { callbacks, handleStatus } = setup()

    handleStatus(statusWith({ playing: true }))
    handleStatus(statusWith({ playing: false }))

    expect(callbacks.onAudioInterruption).toHaveBeenCalledWith(true)
  })

  test('reporting a later pause once the advance has settled', () => {
    const { callbacks, handleStatus, markAutoAdvanceInFlight } = setup()

    handleStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()
    markAutoAdvanceInFlight()
    handleStatus(statusWith({ currentIndex: 1, playing: false }))
    handleStatus(statusWith({ currentIndex: 1, playing: true }))
    handleStatus(statusWith({ currentIndex: 1, playing: false }))

    expect(callbacks.onAudioInterruption.mock.calls).toEqual([[true]])
  })

  test('does not trigger the auto-resume path when the advance settles', () => {
    const { callbacks, handleStatus, markAutoAdvanceInFlight } = setup()

    handleStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()

    markAutoAdvanceInFlight()
    handleStatus(statusWith({ currentIndex: 1, playing: false }))
    handleStatus(statusWith({ currentIndex: 1, playing: true }))

    expect(callbacks.onAudioInterruption).not.toHaveBeenCalled()
  })

  test('opens the window from the wired trackChanged event', () => {
    const callbacks = { onAudioInterruption: jest.fn() }
    jest.mocked(playlistEngine.setCallbacks).mockClear()

    wirePlaylistStatus(callbacks, () => false)
    const wired = jest.mocked(playlistEngine.setCallbacks).mock.calls[0][0]

    wired.onStatus(statusWith({ playing: true }))
    callbacks.onAudioInterruption.mockClear()

    wired.onTrackChanged(0, 1)
    wired.onStatus(statusWith({ currentIndex: 1, playing: false }))

    expect(callbacks.onAudioInterruption).not.toHaveBeenCalled()
  })
})
