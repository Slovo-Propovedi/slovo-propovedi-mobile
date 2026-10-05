import { type File } from 'expo-file-system'
import { DOWNLOAD_TIMEOUT_MS, downloadFileWithTimeout } from './downloadFileWithTimeout'

const mockCreateDownloadTask = jest.fn((..._args: unknown[]) => ({
  downloadAsync: jest.fn(),
})) as jest.Mock
const mockDeleteFile = jest.fn()
const mockFile = { exists: true }

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public static createDownloadTask(...args: unknown[]) {
      return (mockCreateDownloadTask as jest.Mock)(...args)
    }

    public delete = mockDeleteFile
    public exists = mockFile.exists
  },
}))

const SOURCE_URL = 'https://source.test/audio.m4a'
const TIMEOUT_MS = 5000
const DESTINATION = {} as File

const mockPendingDownload = () => {
  mockCreateDownloadTask.mockReturnValue({
    downloadAsync: jest.fn().mockReturnValue(new Promise(() => {})),
  })
}

describe('downloadFileWithTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('rejects an already aborted signal without starting a download', async () => {
    mockPendingDownload()
    const controller = new AbortController()
    controller.abort()

    await expect(
      downloadFileWithTimeout(SOURCE_URL, DESTINATION, undefined, TIMEOUT_MS, controller.signal),
    ).rejects.toThrow(`Download timed out after ${TIMEOUT_MS / 1000}s`)
    expect(mockCreateDownloadTask).not.toHaveBeenCalled()
  })

  test('leaves no partial file behind for an already aborted signal', async () => {
    mockPendingDownload()
    const controller = new AbortController()
    controller.abort()

    await expect(
      downloadFileWithTimeout(SOURCE_URL, DESTINATION, undefined, TIMEOUT_MS, controller.signal),
    ).rejects.toBeDefined()
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  test('rejects when the signal aborts while downloading', async () => {
    mockPendingDownload()
    const controller = new AbortController()

    const pending = downloadFileWithTimeout(
      SOURCE_URL,
      DESTINATION,
      undefined,
      TIMEOUT_MS,
      controller.signal,
    )
    controller.abort()

    await expect(pending).rejects.toThrow(`Download timed out after ${TIMEOUT_MS / 1000}s`)
    expect(mockCreateDownloadTask).toHaveBeenCalledTimes(1)
  })

  test('resolves with the file on success and reports progress', async () => {
    mockCreateDownloadTask.mockImplementation(
      (
        _url: unknown,
        _destination: unknown,
        options: { onProgress: (p: { bytesWritten: number; totalBytes: number }) => void },
      ) => {
        options.onProgress({ bytesWritten: 30, totalBytes: 120 })
        options.onProgress({ bytesWritten: 10, totalBytes: 0 })
        return { downloadAsync: jest.fn().mockResolvedValue(DESTINATION) }
      },
    )

    const progress: number[] = []

    await expect(
      downloadFileWithTimeout(
        SOURCE_URL,
        DESTINATION,
        percent => progress.push(percent),
        TIMEOUT_MS,
      ),
    ).resolves.toBe(DESTINATION)
    expect(progress).toEqual([25])
  })

  test('keeps the default timeout budget exported for callers', () => {
    expect(DOWNLOAD_TIMEOUT_MS).toBe(600_000)
  })
})
