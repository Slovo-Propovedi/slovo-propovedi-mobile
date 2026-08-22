import AsyncStorage from '@react-native-async-storage/async-storage'
import { CURRENT_AUDIO, PLAYER_STARTUP_ATTEMPTS } from 'shared/config'
import { initializePlayer } from './initializePlayer'
import { playerService } from './PlayerService'
import { audioModeManager } from './PlayerService/AudioModeManager'
import { parseStartupAttempts, shouldSkipRestore } from './startupGuard'

jest.mock('./PlayerService', () => ({
  playerService: {
    loadAudio: jest.fn().mockResolvedValue(null),
    setLockScreenMetadata: jest.fn(),
    setVolume: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('./PlayerService/AudioModeManager', () => ({
  audioModeManager: {
    configure: jest.fn().mockResolvedValue(undefined),
  },
}))

const mockedLoadAudio = jest.mocked(playerService.loadAudio)
const mockedConfigure = jest.mocked(audioModeManager.configure)
const mockedSetItem = jest.mocked(AsyncStorage.setItem)

const AUDIO = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const seedStoredAudio = async () => {
  await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(AUDIO))
}

describe('startup crash guard', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  describe('shouldSkipRestore', () => {
    test('returns false below the limit', () => {
      expect(shouldSkipRestore(0)).toBe(false)
      expect(shouldSkipRestore(2)).toBe(false)
    })

    test('returns true at or above the limit', () => {
      expect(shouldSkipRestore(3)).toBe(true)
      expect(shouldSkipRestore(5)).toBe(true)
    })
  })

  describe('parseStartupAttempts', () => {
    test('treats missing or garbage values as 0', () => {
      expect(parseStartupAttempts(null)).toBe(0)
      expect(parseStartupAttempts('garbage')).toBe(0)
      expect(parseStartupAttempts('-5')).toBe(0)
    })

    test('parses valid counters', () => {
      expect(parseStartupAttempts('0')).toBe(0)
      expect(parseStartupAttempts('2')).toBe(2)
    })
  })

  describe('initializePlayer', () => {
    test('skips restore when counter >= 3 and resets counter', async () => {
      await AsyncStorage.setItem(PLAYER_STARTUP_ATTEMPTS, '3')
      await seedStoredAudio()

      await initializePlayer()

      expect(mockedLoadAudio).not.toHaveBeenCalled()
      expect(mockedConfigure).not.toHaveBeenCalled()
      expect(mockedSetItem).toHaveBeenCalledWith(PLAYER_STARTUP_ATTEMPTS, '0')
    })

    test('increments counter and persists BEFORE loadAudio when below threshold', async () => {
      await AsyncStorage.setItem(PLAYER_STARTUP_ATTEMPTS, '1')
      await seedStoredAudio()

      await initializePlayer()

      expect(mockedLoadAudio).toHaveBeenCalled()
      const counterWriteCall = mockedSetItem.mock.calls.findIndex(
        ([key]) => key === PLAYER_STARTUP_ATTEMPTS,
      )
      expect(counterWriteCall).toBeGreaterThanOrEqual(0)
      expect(mockedSetItem.mock.invocationCallOrder[counterWriteCall]).toBeLessThan(
        mockedLoadAudio.mock.invocationCallOrder[0],
      )
      expect(mockedSetItem).toHaveBeenCalledWith(PLAYER_STARTUP_ATTEMPTS, '2')
    })
  })
})
