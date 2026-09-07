import type { LockScreenMetadata } from './types'
import { createWebMediaSession } from './webMediaSession'

interface AudioElementLike {
  currentTime: number
  duration: number
  paused: boolean
  playbackRate: number
}

interface MediaSessionMock {
  metadata: MediaMetadata | null
  playbackState: MediaSessionPlaybackState
  setActionHandler: jest.Mock
  setPositionState: jest.Mock
}

const METADATA: LockScreenMetadata = {
  albumTitle: 'Альбом',
  artist: 'Исполнитель',
  artworkUrl: 'https://example.com/artwork.jpg',
  title: 'Проповедь',
}

const makeMediaSessionMock = (): MediaSessionMock => {
  const mock: MediaSessionMock = {
    metadata: null,
    playbackState: 'none',
    setActionHandler: jest.fn(),
    setPositionState: jest.fn(),
  }
  Object.defineProperty(global.navigator, 'mediaSession', {
    configurable: true,
    value: mock,
  })
  return mock
}

const makeAudio = (overrides: Partial<AudioElementLike> = {}): AudioElementLike => ({
  currentTime: 0,
  duration: 100,
  paused: false,
  playbackRate: 1,
  ...overrides,
})

const makeController = (audio: AudioElementLike | null) => {
  const player = {
    pause: jest.fn(),
    play: jest.fn(),
    seekTo: jest.fn((positionMs: number) => {
      if (audio) audio.currentTime = positionMs / 1000
    }),
  }
  const controller = createWebMediaSession(
    player,
    () => audio as unknown as HTMLAudioElement | null,
  )
  return { audio, controller, player }
}

const getHandler = (mock: MediaSessionMock, action: string) => {
  const call = mock.setActionHandler.mock.calls.find(([name]) => name === action)
  return call ? call[1] : null
}

describe('createWebMediaSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.MediaMetadata = jest.fn().mockImplementation((init: MediaMetadataInit) => init)
  })

  test('registers play/pause/seek handlers and sets metadata with artwork', () => {
    const mock = makeMediaSessionMock()
    const audio = makeAudio()
    const { controller } = makeController(audio)

    controller.setMetadata(METADATA)

    expect(mock.setActionHandler).toHaveBeenCalledWith('play', expect.any(Function))
    expect(mock.setActionHandler).toHaveBeenCalledWith('pause', expect.any(Function))
    expect(mock.setActionHandler).toHaveBeenCalledWith('seekto', expect.any(Function))
    expect(mock.setActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function))
    expect(mock.setActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function))
    expect(mock.setActionHandler).toHaveBeenCalledWith('nexttrack', null)
    expect(mock.setActionHandler).toHaveBeenCalledWith('previoustrack', null)
    expect(mock.metadata).toEqual({
      album: 'Альбом',
      artist: 'Исполнитель',
      artwork: [{ src: 'https://example.com/artwork.jpg' }],
      title: 'Проповедь',
    })
  })

  test('sets metadata without artwork when artworkUrl is missing', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio())

    controller.setMetadata({ title: 'Проповедь' })

    expect(mock.metadata).toEqual({
      album: '',
      artist: '',
      artwork: [],
      title: 'Проповедь',
    })
  })

  test('play and pause handlers delegate to the player', () => {
    const mock = makeMediaSessionMock()
    const { controller, player } = makeController(makeAudio())

    controller.setMetadata(METADATA)

    getHandler(mock, 'play')()
    expect(player.play).toHaveBeenCalled()

    getHandler(mock, 'pause')()
    expect(player.pause).toHaveBeenCalled()
  })

  test('seekto handler seeks in seconds and updates position state', () => {
    const mock = makeMediaSessionMock()
    const audio = makeAudio({ currentTime: 30 })
    const { controller, player } = makeController(audio)

    controller.setMetadata(METADATA)

    getHandler(mock, 'seekto')({ seekTime: 45 })

    expect(player.seekTo).toHaveBeenCalledWith(45000)
    expect(mock.setPositionState).toHaveBeenLastCalledWith({
      duration: 100,
      playbackRate: 1,
      position: 45,
    })
  })

  test('seekforward clamps past the end to the duration', () => {
    const mock = makeMediaSessionMock()
    const audio = makeAudio({ currentTime: 95 })
    const { controller, player } = makeController(audio)

    controller.setMetadata(METADATA)

    getHandler(mock, 'seekforward')({})

    expect(player.seekTo).toHaveBeenCalledWith(100000)
  })

  test('seekbackward clamps below zero to zero', () => {
    const mock = makeMediaSessionMock()
    const audio = makeAudio({ currentTime: 5 })
    const { controller, player } = makeController(audio)

    controller.setMetadata(METADATA)

    getHandler(mock, 'seekbackward')({})

    expect(player.seekTo).toHaveBeenCalledWith(0)
  })

  test('seek handlers use the provided seekOffset instead of the default 10s', () => {
    const mock = makeMediaSessionMock()
    const audio = makeAudio({ currentTime: 30 })
    const { controller, player } = makeController(audio)

    controller.setMetadata(METADATA)

    getHandler(mock, 'seekforward')({ seekOffset: 25 })
    expect(player.seekTo).toHaveBeenCalledWith(55000)

    // currentTime is now 55s after the forward seek
    getHandler(mock, 'seekbackward')({ seekOffset: 25 })
    expect(player.seekTo).toHaveBeenCalledWith(30000)
  })

  test('updatePositionState skips invalid durations', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio({ duration: NaN }))

    controller.setMetadata(METADATA)
    mock.setPositionState.mockClear()

    controller.updatePositionState()

    expect(mock.setPositionState).not.toHaveBeenCalled()
  })

  test('updatePositionState clamps position into [0, duration]', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio({ currentTime: 150 }))

    controller.setMetadata(METADATA)
    mock.setPositionState.mockClear()

    controller.updatePositionState()

    expect(mock.setPositionState).toHaveBeenCalledWith({
      duration: 100,
      playbackRate: 1,
      position: 100,
    })
  })

  test('updatePlaybackState reflects the audio paused flag', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio({ paused: true }))

    controller.setMetadata(METADATA)

    expect(mock.playbackState).toBe('paused')
  })

  test('clear resets metadata, playback state and action handlers', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio())

    controller.setMetadata(METADATA)
    controller.clear()

    expect(mock.metadata).toBeNull()
    expect(mock.playbackState).toBe('none')
    expect(mock.setActionHandler).toHaveBeenCalledWith('play', null)
    expect(mock.setActionHandler).toHaveBeenCalledWith('pause', null)
    expect(mock.setActionHandler).toHaveBeenCalledWith('seekto', null)
  })

  test('setPositionState uses playbackRate 1 when audio.playbackRate is 0', () => {
    const mock = makeMediaSessionMock()
    const { controller } = makeController(makeAudio({ playbackRate: 0 }))

    controller.setMetadata(METADATA)
    mock.setPositionState.mockClear()

    controller.updatePositionState()

    expect(mock.setPositionState).toHaveBeenCalledWith({
      duration: 100,
      playbackRate: 1,
      position: 0,
    })
  })

  test('seekto handler does not call seekTo when seekTime is undefined, absent or NaN', () => {
    const mock = makeMediaSessionMock()
    const { controller, player } = makeController(makeAudio())

    controller.setMetadata(METADATA)

    getHandler(mock, 'seekto')({})
    expect(player.seekTo).not.toHaveBeenCalled()

    getHandler(mock, 'seekto')({ seekTime: undefined })
    expect(player.seekTo).not.toHaveBeenCalled()

    getHandler(mock, 'seekto')({ seekTime: NaN })
    expect(player.seekTo).not.toHaveBeenCalled()
  })

  test('returns no-op controller when navigator.mediaSession is unavailable', () => {
    Object.defineProperty(global.navigator, 'mediaSession', {
      configurable: true,
      value: undefined,
    })

    const { controller, player } = makeController(makeAudio())

    expect(() => controller.setMetadata(METADATA)).not.toThrow()
    expect(() => controller.updatePositionState()).not.toThrow()
    expect(player.seekTo).not.toHaveBeenCalled()
  })
})
