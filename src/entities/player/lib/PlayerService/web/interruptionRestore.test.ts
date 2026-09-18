import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { playerService } from '../index.web'
import { flushProgress } from '../progressFlusher'
import { audioStubs, removeGlobalAudioStub, setupWebPlayerTest } from './testHelpers'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: { get: jest.fn() } }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/model/network', () => ({ isOnlineAtom: jest.fn() }))

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
}))

jest.mock('../BackgroundCachingService', () => ({
  startBackgroundCaching: jest.fn(),
}))

jest.mock('../../../model', () => ({
  currentAudioAtom: jest.fn(),
  durationAtom: jest.fn(),
  setDurationAction: jest.fn(),
  setIsBufferingAction: jest.fn(),
  setIsPlayingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))

jest.mock('../../../playback-rate', () => ({ setPlaybackRateAction: jest.fn() }))

jest.mock('../progressFlusher', () => ({
  flushProgress: jest.fn(),
  scheduleHistoryFlush: jest.fn(),
}))

const AUDIO_URL = 'https://example.com/audio.mp3'

beforeEach(async () => {
  jest.mocked(audioCacheService.isCached).mockResolvedValue(false)
  await setupWebPlayerTest(playerService)
  ;(ctx.get as jest.Mock).mockReset()
})

afterEach(() => {
  removeGlobalAudioStub()
})

describe('WebPlayerService interruption resume', () => {
  afterEach(async () => {
    await playerService.unload()
  })

  test('play restores the snapshot after the browser reset the element', async () => {
    await playerService.loadAudio(AUDIO_URL, 120000)
    audioStubs[0].element.currentTime = 0

    await playerService.play()

    expect(audioStubs[0].element.currentTime).toBe(120)
  })

  test('pause flushes the snapshot instead of the reset currentTime', async () => {
    await playerService.loadAudio(AUDIO_URL, 120000)
    audioStubs[0].element.currentTime = 0

    await playerService.pause()

    expect(flushProgress).toHaveBeenCalledWith(120000)
  })

  test('stop clears the snapshot so a later play stays at 0', async () => {
    await playerService.loadAudio(AUDIO_URL, 120000)
    await playerService.stop()

    await playerService.play()

    expect(audioStubs[0].element.currentTime).toBe(0)
  })

  test('play restores an explicit seek position after the browser reset the element', async () => {
    await playerService.loadAudio(AUDIO_URL)
    await playerService.seekTo(30000)
    audioStubs[0].element.currentTime = 0

    await playerService.play()

    expect(audioStubs[0].element.currentTime).toBe(30)
  })

  test('play does not restore a sub-second snapshot', async () => {
    await playerService.loadAudio(AUDIO_URL, 500)
    audioStubs[0].element.currentTime = 0

    await playerService.play()

    expect(audioStubs[0].element.currentTime).toBe(0)
  })
})
