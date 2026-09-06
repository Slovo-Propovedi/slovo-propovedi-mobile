import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ACTIVE_DOWNLOADS_KEY,
  addActiveDownload,
  clearActiveDownloads,
  getActiveDownloads,
  removeActiveDownload,
} from './webDownloadJournal'

const AUDIO_URL_A = 'https://cdn.example.com/a.mp3'
const AUDIO_URL_B = 'https://cdn.example.com/b.mp3'

describe('webDownloadJournal', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    return AsyncStorage.clear()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('add/remove/get round-trips active downloads', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await addActiveDownload(AUDIO_URL_B)

    await expect(getActiveDownloads()).resolves.toEqual([AUDIO_URL_A, AUDIO_URL_B])

    await removeActiveDownload(AUDIO_URL_A)
    await expect(getActiveDownloads()).resolves.toEqual([AUDIO_URL_B])
  })

  test('addActiveDownload does not duplicate an existing url', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await addActiveDownload(AUDIO_URL_A)

    await expect(getActiveDownloads()).resolves.toEqual([AUDIO_URL_A])
  })

  test('returns empty array when nothing is stored', async () => {
    await expect(getActiveDownloads()).resolves.toEqual([])
  })

  test('returns empty array for corrupt stored JSON', async () => {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, 'not-json{{{')

    await expect(getActiveDownloads()).resolves.toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('returns empty array when stored JSON is not an array', async () => {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify({ urls: [AUDIO_URL_A] }))

    await expect(getActiveDownloads()).resolves.toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('returns empty array when stored JSON has a wrong element type', async () => {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify([AUDIO_URL_A, 42, null]))

    await expect(getActiveDownloads()).resolves.toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('clearActiveDownloads empties the journal', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await clearActiveDownloads()

    await expect(getActiveDownloads()).resolves.toEqual([])
  })
})
