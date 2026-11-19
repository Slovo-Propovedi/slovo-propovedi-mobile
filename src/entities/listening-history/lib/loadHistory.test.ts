import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { LISTENING_HISTORY, LISTENING_PROGRESS_SNAPSHOT } from 'shared/config'
import { mockConsole } from 'shared/mocks'
import { reportError } from 'shared/model/error-dialog'
import { historyAtom, isHistoryLoadedAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { loadHistoryAction } from './loadHistory'
import { clearProgressRecords, readProgressRecords, writeProgressRecords } from './progressStorage'

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

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

describe('loadHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    void AsyncStorage.clear()
  })

  test('loads entries from storage and sets atom', async () => {
    const entry = makeEntry('sermon-1')
    const data: ListeningHistory = [entry]
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify(data))

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(historyAtom)).toEqual(data)
  })

  test('sets atom to empty array when storage is empty', async () => {
    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(historyAtom)).toEqual([])
  })

  test('marks history as loaded after hydration', async () => {
    const ctx = createCtx()
    expect(ctx.get(isHistoryLoadedAtom)).toBe(false)

    await loadHistoryAction(ctx)

    expect(ctx.get(isHistoryLoadedAtom)).toBe(true)
  })

  test('marks history as loaded and keeps empty atom when storage read fails', async () => {
    mockConsole('error')
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'))

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(isHistoryLoadedAtom)).toBe(true)
    expect(ctx.get(historyAtom)).toEqual([])
    expect(reportError).toHaveBeenCalled()
  })

  test('clears orphan snapshot that matches no history entry', async () => {
    const entry = makeEntry('sermon-1')
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify([entry]))
    // Snapshot references a sermon id not in history
    await AsyncStorage.setItem(
      LISTENING_PROGRESS_SNAPSHOT,
      JSON.stringify({
        durationMs: 5000,
        positionMs: 2000,
        sermonId: 'unknown-sermon',
      }),
    )

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    // Snapshot should have been cleared
    const snapshot = await AsyncStorage.getItem(LISTENING_PROGRESS_SNAPSHOT)
    expect(snapshot).toBeNull()
    // Entries should be unchanged
    expect(ctx.get(historyAtom)).toHaveLength(1)
    expect(getEntrySermon(ctx.get(historyAtom)[0])?.id).toBe('sermon-1')
  })

  test('keeps a fresher in-memory entry over the older disk snapshot', async () => {
    const lastPlayedAt = 1_000
    const stale = makeEntry('sermon-1', { durationMs: 0, lastPlayedAt, positionMs: 0 })
    const fresh = makeEntry('sermon-1', { durationMs: 60_000, lastPlayedAt, positionMs: 60_000 })
    await AsyncStorage.setItem(LISTENING_HISTORY, JSON.stringify([stale]))

    const ctx = createCtx()
    historyAtom(ctx, [fresh])
    await loadHistoryAction(ctx)

    const entry = ctx.get(historyAtom)[0]
    expect(entry.durationMs).toBe(60_000)
    expect(entry.positionMs).toBe(60_000)
  })

  test('first hydration seeds legacy progress records from the catalog', async () => {
    const lastPlayedAt = 5_000
    await AsyncStorage.setItem(
      LISTENING_HISTORY,
      JSON.stringify([
        makeEntry('sermon-1', { durationMs: 60_000, lastPlayedAt, positionMs: 30_000 }),
        makeEntry('sermon-2', { durationMs: 0, lastPlayedAt, positionMs: 0 }),
      ]),
    )

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    const progress = ctx.get(sermonProgressAtom)
    expect(progress['sermon-1']).toEqual({
      durationMs: 60_000,
      positionMs: 30_000,
      updatedAt: lastPlayedAt,
    })
    // Запись 0/0 не несёт информации о прослушанности — сид не выполняется.
    expect(progress['sermon-2']).toBeUndefined()
    expect(await readProgressRecords()).toEqual(progress)
  })

  test('repeated load does not re-seed legacy records', async () => {
    const lastPlayedAt = 5_000
    await AsyncStorage.setItem(
      LISTENING_HISTORY,
      JSON.stringify([
        makeEntry('sermon-1', { durationMs: 60_000, lastPlayedAt, positionMs: 30_000 }),
      ]),
    )

    const ctx = createCtx()
    await loadHistoryAction(ctx)
    await clearProgressRecords()

    await loadHistoryAction(ctx)

    expect(ctx.get(sermonProgressAtom)).toEqual({})
  })

  test('first hydration keeps stored progress records over legacy derivation', async () => {
    const lastPlayedAt = 5_000
    await AsyncStorage.setItem(
      LISTENING_HISTORY,
      JSON.stringify([
        makeEntry('sermon-1', { durationMs: 60_000, lastPlayedAt, positionMs: 30_000 }),
      ]),
    )
    await writeProgressRecords({
      'sermon-1': { durationMs: 60_000, positionMs: 45_000, updatedAt: 9_000 },
    })

    const ctx = createCtx()
    await loadHistoryAction(ctx)

    expect(ctx.get(sermonProgressAtom)['sermon-1']).toEqual({
      durationMs: 60_000,
      positionMs: 45_000,
      updatedAt: 9_000,
    })
  })

  test('keeps a progress record committed during hydration over the stale disk snapshot', async () => {
    await writeProgressRecords({
      'sermon-1': { durationMs: 60_000, positionMs: 10_000, updatedAt: 1 },
    })

    const ctx = createCtx()
    // A playback flush lands after the disk read started: the atom already holds
    // a fresher record that the snapshot being read cannot see.
    sermonProgressAtom(ctx, {
      'sermon-2': { durationMs: 90_000, positionMs: 40_000, updatedAt: 2 },
    })

    await loadHistoryAction(ctx)

    const progress = ctx.get(sermonProgressAtom)
    expect(progress['sermon-2']).toEqual({
      durationMs: 90_000,
      positionMs: 40_000,
      updatedAt: 2,
    })
    expect(progress['sermon-1']).toEqual({
      durationMs: 60_000,
      positionMs: 10_000,
      updatedAt: 1,
    })
  })
})
