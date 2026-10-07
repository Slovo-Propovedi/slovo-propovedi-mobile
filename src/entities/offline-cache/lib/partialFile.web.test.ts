import { deletePartialFile, getPartialFileUri } from './partialFile.web'
import { deleteAudioEntry, hasCompleteAudio } from './webCacheApi'

jest.mock('./webCacheApi', () => ({
  deleteAudioEntry: jest.fn(),
  hasCompleteAudio: jest.fn(),
}))

const mockedDeleteAudioEntry = jest.mocked(deleteAudioEntry)
const mockedHasCompleteAudio = jest.mocked(hasCompleteAudio)

const AUDIO_URL = 'https://cdn.example.com/sermon.mp3'

const flushAsync = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('partialFile.web', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('getPartialFileUri returns null (web streams via the service worker)', async () => {
    expect(await getPartialFileUri(AUDIO_URL)).toBeNull()
  })

  test('deletePartialFile removes an uncommitted (partial) cache entry', async () => {
    mockedHasCompleteAudio.mockResolvedValue(false)
    mockedDeleteAudioEntry.mockResolvedValue(true)

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(mockedHasCompleteAudio).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedDeleteAudioEntry).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('deletePartialFile keeps a committed (complete) cache entry', async () => {
    mockedHasCompleteAudio.mockResolvedValue(true)

    deletePartialFile(AUDIO_URL)
    await flushAsync()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
  })

  test('deletePartialFile ignores an empty url', async () => {
    deletePartialFile('')
    await flushAsync()

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
