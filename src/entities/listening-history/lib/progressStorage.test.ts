import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  clearProgressRecords,
  readProgressRecords,
  removeProgressRecords,
  SERMON_PROGRESS_PREFIX,
  writeProgressRecords,
} from './progressStorage'

const key = (sermonId: string): string => `${SERMON_PROGRESS_PREFIX}${sermonId}`

const record = (
  overrides: Partial<{ durationMs: number; positionMs: number; updatedAt: number }> = {},
) => ({
  durationMs: 60_000,
  positionMs: 30_000,
  updatedAt: 1_000,
  ...overrides,
})

describe('progressStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  test('readProgressRecords returns empty object when nothing is stored', async () => {
    expect(await readProgressRecords()).toEqual({})
  })

  test('writeProgressRecords then readProgressRecords round-trips per-sermon records', async () => {
    await writeProgressRecords({
      'sermon-1': record(),
      'sermon-2': record({ durationMs: 10, positionMs: 10, updatedAt: 2 }),
    })

    const stored = await AsyncStorage.getItem(key('sermon-1'))
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored ?? '')).toEqual(record())
    expect(JSON.parse((await AsyncStorage.getItem(key('sermon-2'))) ?? '')).toEqual({
      durationMs: 10,
      positionMs: 10,
      updatedAt: 2,
    })

    expect(await readProgressRecords()).toEqual({
      'sermon-1': record(),
      'sermon-2': { durationMs: 10, positionMs: 10, updatedAt: 2 },
    })
  })

  test('readProgressRecords drops invalid records and keeps valid ones', async () => {
    await writeProgressRecords({ 'sermon-1': record() })
    await AsyncStorage.setItem(key('broken'), 'not-json')
    await AsyncStorage.setItem(
      key('schema'),
      JSON.stringify({ durationMs: 10, positionMs: -5, updatedAt: 1 }),
    )
    await AsyncStorage.setItem('listeningHistory', '[]')

    expect(await readProgressRecords()).toEqual({ 'sermon-1': record() })
  })

  test('removeProgressRecords deletes only the given sermon keys', async () => {
    await writeProgressRecords({ 'sermon-1': record(), 'sermon-2': record() })

    await removeProgressRecords(['sermon-1'])

    expect(await AsyncStorage.getItem(key('sermon-1'))).toBeNull()
    expect(await AsyncStorage.getItem(key('sermon-2'))).not.toBeNull()
  })

  test('removeProgressRecords with empty list is a no-op', async () => {
    await writeProgressRecords({ 'sermon-1': record() })

    await removeProgressRecords([])

    expect(await AsyncStorage.getItem(key('sermon-1'))).not.toBeNull()
  })

  test('clearProgressRecords removes every sermon progress key and nothing else', async () => {
    await writeProgressRecords({ 'sermon-1': record(), 'sermon-2': record() })
    await AsyncStorage.setItem('listeningHistory', '[]')

    await clearProgressRecords()

    expect(await AsyncStorage.getAllKeys()).toEqual(['listeningHistory'])
  })

  test('queued writes keep per-sermon overwrite semantics', async () => {
    await writeProgressRecords({ 'sermon-1': record() })
    await writeProgressRecords({ 'sermon-1': record({ positionMs: 45_000, updatedAt: 2 }) })

    expect(await readProgressRecords()).toEqual({
      'sermon-1': record({ positionMs: 45_000, updatedAt: 2 }),
    })
  })
})
