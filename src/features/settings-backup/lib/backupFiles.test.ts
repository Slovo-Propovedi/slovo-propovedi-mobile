import { AUTO_BACKUP_FILE_NAME } from '../model/backupScalars'
import { listBackupFileOptions } from './backupFiles'

// backupScalars тянет entities/player, а тот — нативный expo-audio.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

const MANUAL_OLD = 'slovo-backup-2026-01-01_10-00.json'
const MANUAL_NEW = 'slovo-backup-2026-01-02_11-30.json'

describe('listBackupFileOptions', () => {
  test('maps a manual backup to a formatted date label', () => {
    expect(listBackupFileOptions([MANUAL_OLD])).toEqual([
      { fileName: MANUAL_OLD, label: '01.01.2026, 10:00' },
    ])
  })

  test('lists the auto file first, then manuals newest-first', () => {
    const options = listBackupFileOptions([MANUAL_OLD, AUTO_BACKUP_FILE_NAME, MANUAL_NEW])

    expect(options.map(option => option.fileName)).toEqual([
      AUTO_BACKUP_FILE_NAME,
      MANUAL_NEW,
      MANUAL_OLD,
    ])
    expect(options[0].label).toContain('Автосинхронизация')
  })

  test('ignores foreign and malformed names', () => {
    const options = listBackupFileOptions([
      'notes.txt',
      'slovo-backup-not-a-date.json',
      'slovo-backup-2026-01-01_10-00.json',
    ])

    expect(options).toHaveLength(1)
    expect(options[0].fileName).toBe(MANUAL_OLD)
  })

  test('returns an empty list when there are no backup files', () => {
    expect(listBackupFileOptions([])).toEqual([])
  })
})
