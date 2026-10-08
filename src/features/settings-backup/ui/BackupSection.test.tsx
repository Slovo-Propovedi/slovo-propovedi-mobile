import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { reportError } from 'shared/model/error-dialog'
import { backupAutosyncEnabledAtom } from '../model/backupFolder'
import { BackupSection } from './BackupSection'

const BACKUP_DIR_URI_KEY = 'backup_dir_uri'
const FOLDER_URI = 'file:///backups'
const NEW_SERVER_URL = 'https://new.example.com'
const IMPORT_LABEL = 'Импортировать'
const EXPORT_LABEL = 'Экспортировать'
const DOWNLOAD_LABEL = 'Скачать копию'
const UPLOAD_LABEL = 'Загрузить из файла'
const MERGE_LABEL = 'Объединить'
const EMPTY_FOLDER_LABEL = 'Папка не выбрана'
const HEADER_NAME = /Резервная копия/

const VALID_BACKUP = {
  data: {},
  exportedAt: '2026-01-01T00:00:00.000Z',
  kind: 'slovo-propovedi-backup',
  version: 1,
}

const mockWriteFile = jest.fn(
  async (_folderUri: null | string, _name: string, _json: string) => undefined,
)
const mockReadFile = jest.fn(async (_folderUri: null | string, _name: string) =>
  JSON.stringify(VALID_BACKUP),
)
const mockListFiles = jest.fn(async (_folderUri: null | string) => [] as string[])
const mockPickBackupFolder = jest.fn(async (_previousUri?: null | string) => null as null | string)
const mockFolderExists = jest.fn(async (_folderUri: null | string) => true)
const mockFolderLabel = jest.fn((_folderUri: null | string) => _folderUri ?? EMPTY_FOLDER_LABEL)
const mockBuildPayload = jest.fn(async () => VALID_BACKUP)
const mockApplyImport = jest.fn(async (..._args: unknown[]) => undefined)
const mockSupportsFolderSync = jest.fn(() => true)
const mockExportViaFilePicker = jest.fn(async (_name: string, _json: string) => undefined)
const mockImportViaFilePicker = jest.fn(async () => null as null | string)

// entities/player тянет нативный expo-audio, который падает при импорте в Jest.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: jest.fn(),
}))

jest.mock('../lib/fileIo', () => ({
  exportViaFilePicker: (name: string, json: string) => mockExportViaFilePicker(name, json),
  folderExists: (folderUri: null | string) => mockFolderExists(folderUri),
  folderLabel: (folderUri: null | string) => mockFolderLabel(folderUri),
  importViaFilePicker: () => mockImportViaFilePicker(),
  listFiles: (folderUri: null | string) => mockListFiles(folderUri),
  pickBackupFolder: (previousUri?: null | string) => mockPickBackupFolder(previousUri),
  readFile: (folderUri: null | string, name: string) => mockReadFile(folderUri, name),
  supportsFolderSync: () => mockSupportsFolderSync(),
  writeFile: (folderUri: null | string, name: string, json: string) =>
    mockWriteFile(folderUri, name, json),
}))

jest.mock('../lib/buildPayload', () => ({
  buildPayload: () => mockBuildPayload(),
}))

jest.mock('../lib/applyImport', () => ({
  applyImport: (...args: unknown[]) => mockApplyImport(...args),
}))

const mockReportError = jest.mocked(reportError)

const renderSection = () => renderWithProviders(<BackupSection />, { ctx: createCtx() })

const renderExpanded = async () => {
  const result = await renderSection()
  await fireEvent.press(result.getByRole('button', { name: HEADER_NAME }))
  return result
}

const renderWithFolder = async () => {
  await AsyncStorage.setItem(BACKUP_DIR_URI_KEY, FOLDER_URI)
  const result = await renderExpanded()

  await waitFor(() => {
    expect(result.getByText(FOLDER_URI)).toBeTruthy()
  })

  return result
}

describe('<BackupSection>', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
    mockReadFile.mockResolvedValue(JSON.stringify(VALID_BACKUP))
    mockListFiles.mockResolvedValue([])
    mockPickBackupFolder.mockResolvedValue(null)
    mockFolderExists.mockResolvedValue(true)
    mockSupportsFolderSync.mockReturnValue(true)
    mockExportViaFilePicker.mockResolvedValue(undefined)
    mockImportViaFilePicker.mockResolvedValue(null)
  })

  test('is collapsed by default and expands on header press', async () => {
    const { getByRole, queryByRole } = await renderSection()
    const header = getByRole('button', { name: HEADER_NAME })

    expect(header).toBeCollapsed()
    expect(queryByRole('button', { name: EXPORT_LABEL })).toBeNull()

    await fireEvent.press(header)

    expect(header).toBeExpanded()
    expect(getByRole('button', { name: EXPORT_LABEL })).toBeTruthy()
  })

  test('shows the empty folder status without a chosen folder', async () => {
    const { getByText } = await renderSection()

    await waitFor(() => {
      expect(getByText(EMPTY_FOLDER_LABEL)).toBeTruthy()
    })
  })

  test('shows the persisted folder label', async () => {
    const { getByText } = await renderWithFolder()

    expect(getByText(FOLDER_URI)).toBeTruthy()
  })

  test('shows the autosync toggle when a persistent folder is supported', async () => {
    const { getByText } = await renderExpanded()

    await waitFor(() => {
      expect(getByText('Автосинхронизация')).toBeTruthy()
    })
  })

  test('marks the stored folder unavailable when it no longer exists', async () => {
    mockFolderExists.mockResolvedValue(false)
    await AsyncStorage.setItem(BACKUP_DIR_URI_KEY, FOLDER_URI)
    const { getByText } = await renderSection()

    await waitFor(() => {
      expect(getByText('Папка недоступна — выберите заново')).toBeTruthy()
    })
  })

  test('exports a manual backup into the chosen folder', async () => {
    const { getByRole } = await renderWithFolder()

    await fireEvent.press(getByRole('button', { name: EXPORT_LABEL }))

    await waitFor(() => {
      expect(mockWriteFile).toHaveBeenCalledWith(
        FOLDER_URI,
        expect.stringMatching(/^slovo-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/),
        expect.any(String),
      )
    })
  })

  test('imports the newest manual backup and applies the chosen mode', async () => {
    mockListFiles.mockResolvedValue(['slovo-backup-2026-01-01_10-00.json'])
    const { getByRole, getByText } = await renderWithFolder()

    await fireEvent.press(getByRole('button', { name: IMPORT_LABEL }))
    await waitFor(() => {
      expect(getByText(MERGE_LABEL)).toBeTruthy()
    })

    await fireEvent.press(getByRole('button', { name: MERGE_LABEL }))

    await waitFor(() => {
      expect(mockApplyImport).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({}),
        'merge',
      )
    })
  })

  test('reports a corrupted backup file instead of crashing', async () => {
    mockReadFile.mockResolvedValue('{not-json')
    const { getByRole } = await renderWithFolder()

    await fireEvent.press(getByRole('button', { name: IMPORT_LABEL }))

    await waitFor(() => {
      expect(mockReportError).toHaveBeenCalled()
    })
    expect(mockApplyImport).not.toHaveBeenCalled()
  })

  test('reports a backup made by a newer app version', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ data: {}, kind: 'slovo-propovedi-backup', version: 2 }),
    )
    const { getByRole } = await renderWithFolder()

    await fireEvent.press(getByRole('button', { name: IMPORT_LABEL }))

    await waitFor(() => {
      expect(mockReportError).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/более новой/),
      )
    })
  })

  test('asks for confirmation before changing the server URL', async () => {
    mockReadFile.mockResolvedValue(
      JSON.stringify({ ...VALID_BACKUP, data: { settings: { serverUrl: NEW_SERVER_URL } } }),
    )
    const { getByRole, getByText } = await renderWithFolder()

    await fireEvent.press(getByRole('button', { name: IMPORT_LABEL }))
    await waitFor(() => {
      expect(getByText(MERGE_LABEL)).toBeTruthy()
    })

    await fireEvent.press(getByRole('button', { name: MERGE_LABEL }))

    await waitFor(() => {
      expect(getByText(NEW_SERVER_URL)).toBeTruthy()
    })
    expect(mockApplyImport).not.toHaveBeenCalled()

    await fireEvent.press(getByRole('button', { name: 'Применить' }))

    await waitFor(() => {
      expect(mockApplyImport).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({}),
        'merge',
      )
    })
  })

  describe('autosync enable', () => {
    const AUTO_FILE = 'slovo-backup-auto.json'
    const OVERWRITE_LABEL = 'Перезаписать бэкап'
    const IMPORT_MERGE_LABEL = 'Импортировать (объединить)'
    const IMPORT_REPLACE_LABEL = 'Импортировать (заменить)'
    const CANCEL_LABEL = 'Отмена'

    test('enables autosync immediately when no auto file exists', async () => {
      const { ctx, getByRole, queryByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))

      await waitFor(() => {
        expect(ctx.get(backupAutosyncEnabledAtom)).toBe(true)
      })
      expect(queryByText(IMPORT_MERGE_LABEL)).toBeNull()
    })

    test('asks what to do when the auto file already exists', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      const { getByRole, getByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))

      await waitFor(() => {
        expect(getByText(IMPORT_MERGE_LABEL)).toBeTruthy()
      })
      expect(getByText(IMPORT_REPLACE_LABEL)).toBeTruthy()
      expect(getByText(OVERWRITE_LABEL)).toBeTruthy()
    })

    test('overwrites the auto file and enables autosync', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      const { ctx, getByRole, getByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))
      await waitFor(() => {
        expect(getByText(OVERWRITE_LABEL)).toBeTruthy()
      })

      await fireEvent.press(getByText(OVERWRITE_LABEL))

      await waitFor(() => {
        expect(mockWriteFile).toHaveBeenCalledWith(FOLDER_URI, AUTO_FILE, expect.any(String))
        expect(ctx.get(backupAutosyncEnabledAtom)).toBe(true)
      })
    })

    test('merges the existing auto file and enables autosync', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      const { ctx, getByRole, getByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))
      await waitFor(() => {
        expect(getByText(IMPORT_MERGE_LABEL)).toBeTruthy()
      })

      await fireEvent.press(getByText(IMPORT_MERGE_LABEL))

      await waitFor(() => {
        expect(mockApplyImport).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({}),
          'merge',
        )
        expect(ctx.get(backupAutosyncEnabledAtom)).toBe(true)
      })
    })

    test('replaces with the existing auto file and enables autosync', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      const { ctx, getByRole, getByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))
      await waitFor(() => {
        expect(getByText(IMPORT_REPLACE_LABEL)).toBeTruthy()
      })

      await fireEvent.press(getByText(IMPORT_REPLACE_LABEL))

      await waitFor(() => {
        expect(mockApplyImport).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({}),
          'replace',
        )
        expect(ctx.get(backupAutosyncEnabledAtom)).toBe(true)
      })
    })

    test('leaves autosync disabled when the dialog is dismissed', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      const { ctx, getByRole, getByText, queryByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))
      await waitFor(() => {
        expect(getByText(CANCEL_LABEL)).toBeTruthy()
      })

      await fireEvent.press(getByText(CANCEL_LABEL))

      await waitFor(() => {
        expect(queryByText(IMPORT_MERGE_LABEL)).toBeNull()
      })
      expect(ctx.get(backupAutosyncEnabledAtom)).toBe(false)
    })

    test('offers only overwrite when the auto file is corrupted', async () => {
      mockListFiles.mockResolvedValue([AUTO_FILE])
      mockReadFile.mockResolvedValue('{not-json')
      const { getByRole, getByText, queryByText } = await renderWithFolder()

      await fireEvent.press(getByRole('checkbox'))

      await waitFor(() => {
        expect(getByText(OVERWRITE_LABEL)).toBeTruthy()
      })
      expect(queryByText(IMPORT_MERGE_LABEL)).toBeNull()
    })
  })

  describe('without folder sync', () => {
    beforeEach(() => {
      mockSupportsFolderSync.mockReturnValue(false)
      mockImportViaFilePicker.mockResolvedValue(JSON.stringify(VALID_BACKUP))
      mockExportViaFilePicker.mockResolvedValue(undefined)
    })

    test('hides the folder row, re-pick state and autosync toggle', async () => {
      const { getByRole, getByText, queryByRole, queryByText } = await renderExpanded()

      await waitFor(() => {
        expect(getByText('Резервная копия')).toBeTruthy()
      })
      expect(queryByText('Выбрать папку')).toBeNull()
      expect(queryByText('Сменить папку')).toBeNull()
      expect(queryByText('Автосинхронизация')).toBeNull()
      expect(queryByText(EMPTY_FOLDER_LABEL)).toBeNull()
      expect(queryByRole('button', { name: EXPORT_LABEL })).toBeNull()
      expect(getByRole('button', { name: DOWNLOAD_LABEL })).toBeTruthy()
      expect(getByRole('button', { name: UPLOAD_LABEL })).toBeTruthy()
    })

    test('exports through the file picker with the manual filename', async () => {
      const { getByRole } = await renderExpanded()

      await fireEvent.press(getByRole('button', { name: DOWNLOAD_LABEL }))

      await waitFor(() => {
        expect(mockExportViaFilePicker).toHaveBeenCalledWith(
          expect.stringMatching(/^slovo-backup-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/),
          expect.any(String),
        )
      })
      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    test('imports through the file picker and applies the chosen mode', async () => {
      const { getByRole, getByText } = await renderExpanded()

      await fireEvent.press(getByRole('button', { name: UPLOAD_LABEL }))
      await waitFor(() => {
        expect(getByText(MERGE_LABEL)).toBeTruthy()
      })

      await fireEvent.press(getByRole('button', { name: MERGE_LABEL }))

      await waitFor(() => {
        expect(mockApplyImport).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({}),
          'merge',
        )
      })
    })

    test('ignores a cancelled picker import', async () => {
      mockImportViaFilePicker.mockResolvedValue(null)
      const { getByRole, queryByText } = await renderExpanded()

      await fireEvent.press(getByRole('button', { name: UPLOAD_LABEL }))

      await waitFor(() => {
        expect(mockImportViaFilePicker).toHaveBeenCalled()
      })
      expect(queryByText(MERGE_LABEL)).toBeNull()
      expect(mockReportError).not.toHaveBeenCalled()
    })
  })
})
