import { deletePartialFile, getPartialFileUri } from './partialFile.web'
import { deleteAudioEntry, hasCompleteAudio } from './webCacheApi'
import { wasDownloadCompleted } from './webCompletedDownloads'

jest.mock('./webCacheApi', () => ({
  deleteAudioEntry: jest.fn(),
  hasCompleteAudio: jest.fn(),
}))

jest.mock('./webCompletedDownloads', () => ({
  wasDownloadCompleted: jest.fn(),
}))

const mockedDeleteAudioEntry = jest.mocked(deleteAudioEntry)
const mockedHasCompleteAudio = jest.mocked(hasCompleteAudio)
const mockedWasDownloadCompleted = jest.mocked(wasDownloadCompleted)

const AUDIO_URL = 'https://cdn.example.com/sermon.mp3'

const flushAsync = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('partialFile.web', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockedWasDownloadCompleted.mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('getPartialFileUri returns null (web streams via the service worker)', async () => {
    expect(await getPartialFileUri(AUDIO_URL)).toBeNull()
  })

  test('deletePartialFile removes a stale uncommitted entry', async () => {
    mockedWasDownloadCompleted.mockReturnValue(false)
    mockedHasCompleteAudio.mockResolvedValue(false)
    mockedDeleteAudioEntry.mockResolvedValue(true)

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(mockedHasCompleteAudio).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedDeleteAudioEntry).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('deletePartialFile keeps a committed (complete) entry', async () => {
    mockedHasCompleteAudio.mockResolvedValue(true)

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
  })

  test('deletePartialFile keeps a complete download whose manifest commit failed', async () => {
    mockedWasDownloadCompleted.mockReturnValue(true)
    mockedHasCompleteAudio.mockResolvedValue(false)

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
  })

  test('deletePartialFile ignores an empty url', async () => {
    deletePartialFile('')
    await flushAsync()

    expect(mockedWasDownloadCompleted).not.toHaveBeenCalled()
    expect(mockedHasCompleteAudio).not.toHaveBeenCalled()
    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
  })

  test('deletePartialFile never throws when the cache access rejects', async () => {
    mockedHasCompleteAudio.mockRejectedValue(new Error('cache down'))

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(console.warn).toHaveBeenCalled()
  })
})
