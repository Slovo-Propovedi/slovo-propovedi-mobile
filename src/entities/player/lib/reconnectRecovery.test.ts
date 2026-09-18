import { audioCacheService } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { isOnlineAtom } from 'shared/model/network'
import { currentAudioAtom } from '../model'
import { playerService } from './PlayerService'
import { startBackgroundCaching } from './PlayerService/BackgroundCachingService'
import { setupReconnectRecovery } from './reconnectRecovery'

jest.mock('./PlayerService', () => ({
  playerService: { recoverStreamAfterReconnect: jest.fn() },
}))

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: { isCached: jest.fn() },
}))

jest.mock('./PlayerService/BackgroundCachingService', () => ({
  startBackgroundCaching: jest.fn(),
}))

const AUDIO = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const OTHER_AUDIO = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/other.mp3',
  id: 'sermon-2',
  title: 'Other Sermon',
}

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('reconnectRecovery', () => {
  let unsubscribe: () => void

  beforeEach(() => {
    jest.clearAllMocks()
    isOnlineAtom(ctx, true)
    currentAudioAtom(ctx, null)
    jest.mocked(audioCacheService.isCached).mockResolvedValue(false)
    unsubscribe = setupReconnectRecovery()
  })

  afterEach(() => {
    unsubscribe()
  })

  test('offline→online re-caches and heals the current track', async () => {
    currentAudioAtom(ctx, AUDIO)
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    await flushMicrotasks()

    expect(startBackgroundCaching).toHaveBeenCalledWith(AUDIO.audioUrl)
    expect(playerService.recoverStreamAfterReconnect).toHaveBeenCalledWith(AUDIO.audioUrl)
  })

  test('cached track is not re-enqueued but is still healed', async () => {
    jest.mocked(audioCacheService.isCached).mockResolvedValue(true)
    currentAudioAtom(ctx, AUDIO)
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    await flushMicrotasks()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
    expect(playerService.recoverStreamAfterReconnect).toHaveBeenCalledWith(AUDIO.audioUrl)
  })

  test('no current audio does nothing', async () => {
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    await flushMicrotasks()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
    expect(playerService.recoverStreamAfterReconnect).not.toHaveBeenCalled()
  })

  test('setup while online does not trigger recovery on the immediate subscribe fire', async () => {
    await flushMicrotasks()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
    expect(playerService.recoverStreamAfterReconnect).not.toHaveBeenCalled()
  })

  test('online→online write does not trigger recovery', async () => {
    currentAudioAtom(ctx, AUDIO)
    isOnlineAtom(ctx, true)
    await flushMicrotasks()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
    expect(playerService.recoverStreamAfterReconnect).not.toHaveBeenCalled()
  })

  test('false→true→false→true triggers recovery twice', async () => {
    currentAudioAtom(ctx, AUDIO)
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    await flushMicrotasks()

    expect(startBackgroundCaching).toHaveBeenCalledTimes(2)
    expect(playerService.recoverStreamAfterReconnect).toHaveBeenCalledTimes(2)
  })

  test('track switched while cache check is in flight does nothing', async () => {
    let resolveIsCached: (value: boolean) => void = () => {}
    jest.mocked(audioCacheService.isCached).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveIsCached = resolve
        }),
    )
    currentAudioAtom(ctx, AUDIO)
    isOnlineAtom(ctx, false)
    isOnlineAtom(ctx, true)
    currentAudioAtom(ctx, OTHER_AUDIO)
    resolveIsCached(false)
    await flushMicrotasks()

    expect(startBackgroundCaching).not.toHaveBeenCalled()
    expect(playerService.recoverStreamAfterReconnect).not.toHaveBeenCalled()
  })

  test('heal rejection is caught and logged', async () => {
    jest
      .mocked(playerService.recoverStreamAfterReconnect)
      .mockRejectedValue(new Error('heal failed'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      currentAudioAtom(ctx, AUDIO)
      isOnlineAtom(ctx, false)
      isOnlineAtom(ctx, true)
      await flushMicrotasks()

      expect(errorSpy).toHaveBeenCalledWith(
        '[reconnectRecovery] stream heal failed:',
        expect.any(Error),
      )
    } finally {
      errorSpy.mockRestore()
    }
  })
})
