import AsyncStorage from '@react-native-async-storage/async-storage'
import { LISTENING_HISTORY, LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { reconcileOnHydration } from './reconcileOnHydration'

const makeEntry = (
  sermonId: string,
  overrides: Partial<ListeningHistoryEntry> = {},
): ListeningHistoryEntry => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [
      {
        artist: 'Author',
        artwork: 'sermon.jpg',
        audioUrl: 'https://example.com/audio.mp3',
        id: sermonId,
        title: `Sermon ${sermonId}`,
      },
    ],
    title: 'Playlist',
  },
  positionMs: 500,
  ...overrides,
})

describe('reconcileOnHydration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  test('keeps catalog position when no snapshot exists (flush cleared it)', async () => {
    // Simulate: seek-while-paused flushed the catalog to 500s and cleared the snapshot.
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))

    const result = await reconcileOnHydration()

    expect(result).toHaveLength(1)
    expect(result[0].positionMs).toBe(500)
    expect(getEntrySermon(result[0])?.id).toBe('sermon-1')
  })

  test('applies snapshot positionMs over the catalog entry when snapshot exists', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))
    await AsyncStorage.setItem(
      LISTENING_PROGRESS_SNAPSHOT,
      JSON.stringify({ durationMs: 1000, positionMs: 200, sermonId: 'sermon-1' }),
    )

    const result = await reconcileOnHydration()

    expect(result[0].positionMs).toBe(200)
    // Snapshot is cleared after reconcile
    const snapshot = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    expect(snapshot).toBeNull()
  })

  test('drops snapshot when catalog entry is already completed', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 3_600_000, positionMs: 3_595_000 })
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))
    await AsyncStorage.setItem(
      LISTENING_PROGRESS_SNAPSHOT,
      JSON.stringify({ durationMs: 3_600_000, positionMs: 3_590_000, sermonId: 'sermon-1' }),
    )

    const result = await reconcileOnHydration()

    // Completed entry keeps its position (resume position 0 semantics unchanged)
    expect(result[0].positionMs).toBe(3_595_000)
    // Snapshot is dropped after reconcile
    const snapshot = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    expect(snapshot).toBeNull()
  })

  test('silently drops a snapshot whose sermonId is absent from the catalog', async () => {
    const entry = makeEntry('sermon-1', { durationMs: 1000, positionMs: 500 })
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))
    await AsyncStorage.setItem(
      LISTENING_PROGRESS_SNAPSHOT,
      JSON.stringify({ durationMs: 1000, positionMs: 200, sermonId: 'unknown-sermon' }),
    )

    const result = await reconcileOnHydration()

    // Catalog is unchanged (no matching entry to reconcile into)
    expect(result).toHaveLength(1)
    expect(result[0].positionMs).toBe(500)
    // Orphan snapshot is cleared
    const snapshot = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    expect(snapshot).toBeNull()
  })
})
