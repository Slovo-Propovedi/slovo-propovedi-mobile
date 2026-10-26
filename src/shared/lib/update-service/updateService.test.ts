import * as ApkInstaller from 'apk-installer'
import { File } from 'expo-file-system'
import { Platform } from 'react-native'
import { listContents, unzip } from 'react-native-zip-archive'
import { downloadUpdateZip, extractApkFromZip } from './updateService'

jest.mock('expo-file-system', () => {
  class MockFile {
    public constructor(_parent: unknown, name: string) {
      this.uri = `file:///cache/updates/${name}`
      mockFileInstances.push(this)
    }

    public static createDownloadTask = jest.fn()
    public delete = jest.fn(() => {
      if (mockFileState.deleteThrows) throw new Error('delete failed')
    })
    public uri: string

    public get exists(): boolean {
      return mockFileState.zipExists || mockFileState.downloadStarted
    }
  }

  class MockDirectory {
    public constructor(_parent: unknown, _name: string) {}

    public create = jest.fn()
    public delete = jest.fn()
    public exists = true
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { cache: 'file:///cache' },
  }
})

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(),
}))

jest.mock('react-native-zip-archive', () => ({
  listContents: jest.fn(),
  unzip: jest.fn(),
}))

jest.mock('apk-installer', () => ({
  canRequestPackageInstalls: jest.fn(),
  computeSha256: jest.fn(),
  installApk: jest.fn(),
  isApkInstallerAvailable: jest.fn(() => false),
  openInstallPermissionSettings: jest.fn(),
}))

const mockFileState = { deleteThrows: false, downloadStarted: false, zipExists: false }
const mockFileInstances: Array<{ delete: jest.Mock; uri: string }> = []

const mockedCreateDownloadTask = File.createDownloadTask as jest.Mock
const mockedComputeSha256 = ApkInstaller.computeSha256 as jest.Mock
const mockedListContents = listContents as jest.Mock
const mockedUnzip = unzip as jest.Mock
const mockFetch = jest.fn()
const originalFetch = global.fetch

let capturedSignal: AbortSignal | undefined

const ZIP_FILE_NAME = 'slovo-propovedi-update.zip'
const EXAMPLE_URL = `https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/v0.3.0/${ZIP_FILE_NAME}`
const SUMS_URL =
  'https://github.com/Slovo-Propovedi/slovo-propovedi-mobile/releases/download/v0.3.0/SHA256SUMS.txt'
const DOWNLOADED_URI = `file:///cache/updates/${ZIP_FILE_NAME}`
const ZIP_PATH = '/cache/updates/slovo-propovedi-update.zip'
const TIMEOUT_MS = 50
const TIMEOUT_ERROR_MESSAGE = 'Download timed out after 0.05s'
const ZIP_SHA256 = 'a'.repeat(64)
const SUMS_TEXT = `${ZIP_SHA256}  ${ZIP_FILE_NAME}\n`
const INTEGRITY = { sha256SumsDownloadUrl: SUMS_URL }

const mockDownloadTask = (downloadAsync: jest.Mock): void => {
  mockedCreateDownloadTask.mockImplementation((_url, _destination, options) => {
    mockFileState.downloadStarted = true
    capturedSignal = options?.signal
    return { downloadAsync }
  })
}

const getZipFile = () => mockFileInstances.find(file => file.uri.includes(ZIP_FILE_NAME))

beforeEach(() => {
  jest.clearAllMocks()
  mockFileInstances.length = 0
  mockFileState.deleteThrows = false
  mockFileState.downloadStarted = false
  mockFileState.zipExists = false
  capturedSignal = undefined
  jest.replaceProperty(Platform, 'OS', 'android')
  global.fetch = mockFetch as unknown as typeof fetch
  mockFetch.mockResolvedValue({ ok: true, text: async () => SUMS_TEXT })
  mockedComputeSha256.mockResolvedValue(ZIP_SHA256)
})

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('downloadUpdateZip', () => {
  test('downloads and verifies the zip, returning its uri', async () => {
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    const uri = await downloadUpdateZip(EXAMPLE_URL, undefined, undefined, INTEGRITY)

    expect(uri).toBe(DOWNLOADED_URI)
    expect(mockFetch).toHaveBeenCalledWith(
      SUMS_URL,
      expect.objectContaining({ signal: expect.anything() }),
    )
    expect(mockedComputeSha256).toHaveBeenCalledWith(DOWNLOADED_URI)
    expect(mockedCreateDownloadTask).toHaveBeenCalledWith(
      EXAMPLE_URL,
      expect.any(File),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  test('deletes a stale zip before downloading', async () => {
    mockFileState.zipExists = true
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    await downloadUpdateZip(EXAMPLE_URL, undefined, undefined, INTEGRITY)

    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('rejects with a timeout error when the download hangs', async () => {
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS, INTEGRITY)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )
    expect(capturedSignal?.aborted).toBe(true)
  })

  test('deletes the partial zip file when the download times out', async () => {
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS, INTEGRITY)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )

    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('keeps partial-file cleanup best-effort when delete throws', async () => {
    mockFileState.deleteThrows = true
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS, INTEGRITY)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  test('propagates non-timeout download errors unchanged', async () => {
    const downloadAsync = jest.fn().mockRejectedValue(new Error('network down'))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, undefined, INTEGRITY)).rejects.toThrow(
      'network down',
    )
    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('reports download progress through the callback', async () => {
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)
    const onProgress = jest.fn()

    await downloadUpdateZip(EXAMPLE_URL, onProgress, undefined, INTEGRITY)

    const options = mockedCreateDownloadTask.mock.calls[0][2]
    options?.onProgress?.({ bytesWritten: 50, totalBytes: 100 })
    expect(onProgress).toHaveBeenCalledWith(50)
  })

  test('rejects a download URL outside the allowlist', async () => {
    await expect(
      downloadUpdateZip('https://evil.example/update.zip', undefined, undefined, INTEGRITY),
    ).rejects.toThrow('Update download URL is not allowed')

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockedCreateDownloadTask).not.toHaveBeenCalled()
  })

  test('aborts before downloading when the release has no checksum asset', async () => {
    await expect(
      downloadUpdateZip(EXAMPLE_URL, undefined, undefined, { sha256SumsDownloadUrl: null }),
    ).rejects.toThrow('no SHA256SUMS.txt asset')

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockedCreateDownloadTask).not.toHaveBeenCalled()
    expect(mockedUnzip).not.toHaveBeenCalled()
  })

  test('aborts before extraction when the computed hash does not match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `${'b'.repeat(64)}  ${ZIP_FILE_NAME}\n`,
    })
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, undefined, INTEGRITY)).rejects.toThrow(
      'SHA-256 mismatch',
    )
    expect(mockedUnzip).not.toHaveBeenCalled()
  })

  test('aborts when the checksum file has no line for the archive', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `${'b'.repeat(64)}  another-file.zip\n`,
    })
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, undefined, INTEGRITY)).rejects.toThrow(
      `no checksum for ${ZIP_FILE_NAME}`,
    )
    expect(mockedUnzip).not.toHaveBeenCalled()
  })
})

describe('extractApkFromZip', () => {
  test('rejects an archive entry that escapes the extraction directory', async () => {
    mockedListContents.mockResolvedValue([{ isDirectory: false, path: '../../update.apk' }])

    await expect(extractApkFromZip(ZIP_PATH)).rejects.toThrow(
      'Unsafe path in update archive: ../../update.apk',
    )
    expect(mockedUnzip).not.toHaveBeenCalled()
  })
})
