import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { isSeekingAtom, seekTargetPositionAtom } from '../../model'
import { audioLoader } from './AudioLoader'
import { playerService } from './index.native'
import { playbackController } from './PlaybackController'
import { playerStatusListener } from './PlayerStatusListener'

jest.mock('./AudioLoader', () => ({ audioLoader: { replaceAudio: jest.fn() } }))

jest.mock('./AudioModeManager', () => ({ audioModeManager: { configure: jest.fn() } }))

jest.mock('./LockScreenControls', () => ({ lockScreenControls: {} }))

jest.mock('./nativePlayerHelpers', () => ({
  createAudioInterruptionHandler: jest.fn(() => jest.fn()),
  setupPlayerListeners: jest.fn(),
}))

jest.mock('./PlayerStatusListener', () => ({ playerStatusListener: { cleanup: jest.fn() } }))

jest.mock('./TrackAutoAdvanceService/TrackAutoAdvanceService', () => ({
  trackAutoAdvanceService: { setPlayerActions: jest.fn() },
}))

const createPlayerStub = (): AudioPlayer => ({ isLoaded: true }) as unknown as AudioPlayer

const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('PlayerService.replaceAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isSeekingAtom(ctx, false)
    seekTargetPositionAtom(ctx, null)
  })

  test('resets the seek guard so the new track position events are not ignored', async () => {
    isSeekingAtom(ctx, true)
    seekTargetPositionAtom(ctx, 60000)
    ;(audioLoader.replaceAudio as jest.Mock).mockResolvedValue(createPlayerStub())

    await playerService.replaceAudio('https://example.com/next.mp3')
    await flushMicrotasks()

    expect(ctx.get(isSeekingAtom)).toBe(false)
    expect(ctx.get(seekTargetPositionAtom)).toBe(null)
  })
})

describe('PlayerService.stop', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('detaches the status listener before pausing (no post-stop interruption flush)', async () => {
    const cleanupSpy = jest.mocked(playerStatusListener.cleanup)
    const stopSpy = jest.spyOn(playbackController, 'stop').mockResolvedValue(undefined)

    await playerService.stop()

    expect(cleanupSpy).toHaveBeenCalled()
    expect(stopSpy).toHaveBeenCalled()
    expect(cleanupSpy.mock.invocationCallOrder[0]).toBeLessThan(stopSpy.mock.invocationCallOrder[0])
  })
})
