import { importAudio } from './importAudio'
import { type ImportPhaseProgress, type ImportSettings } from './importTypes'

const mockResolveInvidiousAudio = jest.fn()
const mockResolveYoutubeAudio = jest.fn()
const mockUploadSermonFile = jest.fn()
const mockDownloadAsync = jest.fn()
const mockCreateDownloadTask = jest.fn()
const mockDeleteFile = jest.fn()

jest.mock('./invidiousSource', () => ({
  resolveInvidiousAudio: (...args: unknown[]) => mockResolveInvidiousAudio(...args),
}))

jest.mock('./youtubeSource', () => ({
  resolveYoutubeAudio: (...args: unknown[]) => mockResolveYoutubeAudio(...args),
}))

jest.mock('shared/api', () => ({
  uploadSermonFile: (...args: unknown[]) => mockUploadSermonFile(...args),
}))

jest.mock('expo-file-system', () => {
  class MockFile {
    public static createDownloadTask = (...args: unknown[]) => mockCreateDownloadTask(...args)

    public constructor(_parent: unknown, name: string) {
      this.name = name
      this.uri = `file:///cache/${name}`
    }

    public delete = mockDeleteFile
    public exists = true
    public name: string
    public uri: string
  }

  return { File: MockFile, Paths: { cache: 'file:///cache' } }
})

const VIDEO_ID = 'lV6YkF7ytxs'
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`
const AUDIO_URL = 'https://inv.test/videoplayback?audio'
const FILE_URL = 'https://cdn.test/sermon.m4a'
const TITLE = 'Проповедь о покаянии'
const DESCRIPTION = 'Текст проповеди'

const SETTINGS: ImportSettings = {
  invidiousBaseUrl: 'https://inv.phobos.observer',
  source: 'invidious',
}

const RESOLVED = {
  audioUrl: AUDIO_URL,
  description: DESCRIPTION,
  durationSec: 2965,
  title: TITLE,
  videoId: VIDEO_ID,
}

const collectProgress = () => {
  const phases: ImportPhaseProgress[] = []

  return { onPhase: (progress: ImportPhaseProgress) => phases.push(progress), phases }
}

const mockSuccessfulDownload = () => {
  mockCreateDownloadTask.mockImplementation((_url, _destination, options) => {
    options.onProgress({ bytesWritten: 50, totalBytes: 100 })
    return { downloadAsync: mockDownloadAsync }
  })
  mockDownloadAsync.mockResolvedValue({ uri: 'file:///cache/audio.m4a' })
}

describe('importAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResolveInvidiousAudio.mockResolvedValue(RESOLVED)
    mockUploadSermonFile.mockResolvedValue({ fileName: 'audio.m4a', fileUrl: FILE_URL })
    mockSuccessfulDownload()
  })

  test('rejects a link that is not a youtube video', async () => {
    const { onPhase } = collectProgress()

    await expect(
      importAudio({ onPhase, settings: SETTINGS, url: 'https://vimeo.com/1' }),
    ).rejects.toMatchObject({ code: 'parse' })
    expect(mockResolveInvidiousAudio).not.toHaveBeenCalled()
  })

  test('resolves through youtube when the youtube source is selected', async () => {
    const { onPhase } = collectProgress()
    mockResolveYoutubeAudio.mockResolvedValue(RESOLVED)

    await importAudio({ onPhase, settings: { ...SETTINGS, source: 'youtube' }, url: VIDEO_URL })

    expect(mockResolveYoutubeAudio).toHaveBeenCalledWith(VIDEO_ID)
    expect(mockResolveInvidiousAudio).not.toHaveBeenCalled()
  })

  test('downloads, uploads and returns the imported sermon data', async () => {
    const { onPhase, phases } = collectProgress()

    const imported = await importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL })

    expect(imported).toEqual({ audioUrl: FILE_URL, description: DESCRIPTION, title: TITLE })
    expect(mockCreateDownloadTask).toHaveBeenCalledWith(
      AUDIO_URL,
      expect.objectContaining({ uri: `file:///cache/${TITLE}.m4a` }),
      expect.any(Object),
    )
    expect(mockUploadSermonFile).toHaveBeenCalledWith(
      {
        mimeType: 'audio/mp4',
        name: `${TITLE}.m4a`,
        uri: `file:///cache/${TITLE}.m4a`,
      },
      expect.any(Object),
    )
    expect(phases).toEqual([{ percent: 50, phase: 'download' }])
  })

  test('sanitizes the title of the temporary file', async () => {
    const { onPhase } = collectProgress()
    mockResolveInvidiousAudio.mockResolvedValue({
      ...RESOLVED,
      title: 'Проповедь: "о покаянии" / 1',
    })

    await importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL })

    expect(mockUploadSermonFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Проповедь- -о покаянии- - 1.m4a' }),
      expect.any(Object),
    )
  })

  test('reports download progress and upload progress as separate phases', async () => {
    const { onPhase, phases } = collectProgress()
    mockUploadSermonFile.mockImplementation((_asset, options) => {
      options.onProgress(80)
      return Promise.resolve({ fileName: 'audio.m4a', fileUrl: FILE_URL })
    })

    await importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL })

    expect(phases).toEqual([
      { percent: 50, phase: 'download' },
      { percent: 80, phase: 'upload' },
    ])
  })

  test('reports an upload failure with a dedicated code', async () => {
    const { onPhase } = collectProgress()
    mockUploadSermonFile.mockRejectedValue(new Error('Request failed with status code 413'))

    await expect(
      importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL }),
    ).rejects.toMatchObject({
      code: 'upload-failed',
    })
  })

  test('maps a raw download failure to a service error', async () => {
    const { onPhase } = collectProgress()
    mockDownloadAsync.mockRejectedValue(new Error('Network request failed'))

    await expect(
      importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL }),
    ).rejects.toMatchObject({
      code: 'service-unavailable',
    })
    expect(mockUploadSermonFile).not.toHaveBeenCalled()
  })

  test('deletes the temporary file after the import', async () => {
    const { onPhase } = collectProgress()

    await importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL })

    expect(mockDeleteFile).toHaveBeenCalled()
  })

  test('deletes the temporary file when the upload fails', async () => {
    const { onPhase } = collectProgress()
    mockUploadSermonFile.mockRejectedValue(new Error('nope'))

    await expect(importAudio({ onPhase, settings: SETTINGS, url: VIDEO_URL })).rejects.toBeDefined()

    expect(mockDeleteFile).toHaveBeenCalled()
  })
})
