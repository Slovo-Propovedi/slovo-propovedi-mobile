import { BACKUP_KIND, BACKUP_VERSION } from '../model/backupScalars'
import { parseBackupFile } from './parseBackupFile'

// backupPayload тянет entities/player, а тот — нативный expo-audio.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

const validRaw = JSON.stringify({
  data: {},
  exportedAt: '2026-01-01T00:00:00.000Z',
  kind: BACKUP_KIND,
  version: BACKUP_VERSION,
})

describe('parseBackupFile', () => {
  test('accepts a valid backup file', () => {
    const result = parseBackupFile(validRaw)

    expect(result.status).toBe('ok')
  })

  test('rejects corrupted JSON', () => {
    expect(parseBackupFile('{not-json')).toEqual({ status: 'invalid' })
  })

  test('rejects a truncated file', () => {
    expect(parseBackupFile('{"kind":"slovo-propovedi-backup","version":1,"data":')).toEqual({
      status: 'invalid',
    })
  })

  test('rejects a foreign file with another marker', () => {
    const foreign = JSON.stringify({ data: {}, kind: 'some-other-app', version: 1 })

    expect(parseBackupFile(foreign)).toEqual({ status: 'invalid' })
  })

  test('reports a newer backup version distinctly', () => {
    const newer = JSON.stringify({ data: {}, kind: BACKUP_KIND, version: BACKUP_VERSION + 1 })

    expect(parseBackupFile(newer)).toEqual({ status: 'newer-version', version: BACKUP_VERSION + 1 })
  })

  test('rejects an older backup version', () => {
    const older = JSON.stringify({ data: {}, kind: BACKUP_KIND, version: 0 })

    expect(parseBackupFile(older)).toEqual({ status: 'invalid' })
  })

  test('rejects a valid envelope with invalid data', () => {
    const badData = JSON.stringify({
      data: { listeningHistory: 'not-an-array' },
      kind: BACKUP_KIND,
      version: BACKUP_VERSION,
    })

    expect(parseBackupFile(badData)).toEqual({ status: 'invalid' })
  })
})
