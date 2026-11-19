import AsyncStorage from '@react-native-async-storage/async-storage'
import { writeProgressRecords } from 'entities/listening-history'
import { LISTENING_HISTORY } from 'shared/config'
import { buildPayload } from './buildPayload'

// buildPayload тянет entities/player, а тот — нативный expo-audio.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

describe('buildPayload (progress records)', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('includes the sermonProgress section in the payload', async () => {
    await AsyncStorage.setItem(LISTENING_HISTORY, '[]')
    await writeProgressRecords({
      'sermon-1': { durationMs: 60_000, positionMs: 30_000, updatedAt: 1 },
    })

    const payload = await buildPayload()

    expect(payload.data.sermonProgress).toEqual({
      'sermon-1': { durationMs: 60_000, positionMs: 30_000, updatedAt: 1 },
    })
    expect(payload.data.listeningHistory).toEqual([])
  })
})
