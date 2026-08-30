import AsyncStorage from '@react-native-async-storage/async-storage'
import { LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'
import {
  clearLiveProgressSnapshot,
  type LiveProgressSnapshot,
  readLiveProgressSnapshot,
} from './liveProgressStorage'

const KEY = LISTENING_PROGRESS_SNAPSHOT

const snapshot: LiveProgressSnapshot = {
  durationMs: 3_600_000,
  positionMs: 1_200_000,
  sermonId: 'sermon-42',
}

describe('liveProgressStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  test('read returns snapshot stored under the key', async () => {
    // Write directly to storage to avoid fire-and-forget timing
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot))

    const result = await readLiveProgressSnapshot()
    expect(result).toEqual(snapshot)
  })

  test('read returns undefined when key is empty', async () => {
    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined for corrupt JSON', async () => {
    await AsyncStorage.setItem(KEY, '{not valid json')

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined when sermonId is missing', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ durationMs: 1000, positionMs: 500 }))

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined when positionMs is not a number', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ durationMs: 1000, positionMs: 'oops', sermonId: 's1' }),
    )

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined when positionMs is negative', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ durationMs: 1000, positionMs: -1, sermonId: 's1' }),
    )

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined when durationMs is negative', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ durationMs: -5, positionMs: 500, sermonId: 's1' }),
    )

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('read returns undefined when durationMs is not a number', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ durationMs: false, positionMs: 500, sermonId: 's1' }),
    )

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('clear → read returns undefined', async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot))

    clearLiveProgressSnapshot()

    // Wait for fire-and-forget removeItem to resolve
    await new Promise(resolve => {
      setTimeout(resolve, 0)
    })

    const result = await readLiveProgressSnapshot()
    expect(result).toBeUndefined()
  })

  test('clear calls removeItem with correct key', () => {
    clearLiveProgressSnapshot()

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(KEY)
  })
})
