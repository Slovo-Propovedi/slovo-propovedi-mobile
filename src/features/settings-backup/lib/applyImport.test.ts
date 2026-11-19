import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import {
  type ListeningHistory,
  readProgressRecords,
  type SermonProgressRecord,
  writeProgressRecords,
} from 'entities/listening-history'
import { LISTENING_HISTORY } from 'shared/config'
import { backupFileSchema } from '../model/backupPayload'
import { BACKUP_KIND, BACKUP_VERSION } from '../model/backupScalars'
import { applyImport } from './applyImport'

// applyImport тянет entities/player, а тот — нативный expo-audio.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

const makeCatalogEntry = (sermonId: string): ListeningHistory => [
  {
    durationMs: 60_000,
    lastPlayedAt: 5_000,
    playlist: {
      artwork: 'art.jpg',
      id: 'pl-1',
      sermons: [],
      title: 'Playlist',
    },
    positionMs: 30_000,
    sermon: {
      artist: 'Author',
      artwork: 'sermon.jpg',
      audioUrl: 'https://example.com/audio.mp3',
      id: sermonId,
      title: 'Sermon',
    },
  },
]

const makeFile = (data: Record<string, unknown>): ReturnType<typeof backupFileSchema.parse> =>
  backupFileSchema.parse({
    data,
    exportedAt: '2026-01-01T00:00:00.000Z',
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
  })

const record = (updatedAt: number): SermonProgressRecord => ({
  durationMs: 60_000,
  positionMs: 30_000,
  updatedAt,
})

describe('applyImport (progress records)', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('replace clears stale records and writes file records plus catalog derivation', async () => {
    await writeProgressRecords({ 'old-sermon': record(1) })
    const file = makeFile({
      listeningHistory: makeCatalogEntry('catalog-sermon'),
      sermonProgress: { 'file-sermon': record(9) },
    })

    await applyImport(createCtx(), file.data, 'replace')

    const stored = await readProgressRecords()
    expect(stored['old-sermon']).toBeUndefined()
    expect(stored['file-sermon']).toEqual(record(9))
    expect(stored['catalog-sermon']).toEqual({
      durationMs: 60_000,
      positionMs: 30_000,
      updatedAt: 5_000,
    })
  })

  test('merge keeps the record with the fresher updatedAt per sermon', async () => {
    await writeProgressRecords({ 'local-fresh': record(2_000), 'local-stale': record(2_000) })
    const file = makeFile({
      listeningHistory: [],
      sermonProgress: { 'local-fresh': record(1_000), 'local-stale': record(3_000) },
    })

    await applyImport(createCtx(), file.data, 'merge')

    const stored = await readProgressRecords()
    expect(stored['local-fresh']).toEqual(record(2_000))
    expect(stored['local-stale']).toEqual(record(3_000))
  })

  test('merge derives catalog entries missing from the file section', async () => {
    await writeProgressRecords({})
    const file = makeFile({ listeningHistory: makeCatalogEntry('catalog-sermon') })

    await applyImport(createCtx(), file.data, 'merge')

    expect((await readProgressRecords())['catalog-sermon']).toEqual({
      durationMs: 60_000,
      positionMs: 30_000,
      updatedAt: 5_000,
    })
  })

  test('old file without the section derives records from the catalog (replace)', async () => {
    await writeProgressRecords({ 'old-sermon': record(1) })
    const file = makeFile({ listeningHistory: makeCatalogEntry('catalog-sermon') })

    await applyImport(createCtx(), file.data, 'replace')

    const stored = await readProgressRecords()
    expect(stored['old-sermon']).toBeUndefined()
    expect(stored['catalog-sermon']).toEqual({
      durationMs: 60_000,
      positionMs: 30_000,
      updatedAt: 5_000,
    })
  })

  test('catalog history itself is written (replace) and hydrated into the atom', async () => {
    const file = makeFile({ listeningHistory: makeCatalogEntry('catalog-sermon') })

    await applyImport(createCtx(), file.data, 'replace')

    const storedHistory = JSON.parse(
      (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
    ) as ListeningHistory
    expect(storedHistory).toHaveLength(1)
    expect(storedHistory[0]?.sermon?.id).toBe('catalog-sermon')
  })
})
