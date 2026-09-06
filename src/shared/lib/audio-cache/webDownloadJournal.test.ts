import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ACTIVE_DOWNLOADS_KEY,
  addActiveDownload,
  addActiveDownloadWithHeartbeat,
  clearActiveDownloads,
  getActiveDownloads,
  refreshActiveDownload,
  removeActiveDownload,
  removeActiveDownloadEntries,
  sessionId,
} from './webDownloadJournal'

const AUDIO_URL_A = 'https://cdn.example.com/a.mp3'
const AUDIO_URL_B = 'https://cdn.example.com/b.mp3'

describe('webDownloadJournal', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    return AsyncStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
    consoleErrorSpy.mockRestore()
  })

  test('add/remove/get round-trips active downloads', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await addActiveDownload(AUDIO_URL_B)

    const entries = await getActiveDownloads()
    expect(entries.map(entry => entry.url)).toEqual([AUDIO_URL_A, AUDIO_URL_B])
    expect(entries.every(entry => entry.sessionId === sessionId)).toBe(true)

    await removeActiveDownload(AUDIO_URL_A)
    await expect(getActiveDownloads()).resolves.toEqual([
      expect.objectContaining({ url: AUDIO_URL_B }),
    ])
  })

  test('addActiveDownload does not duplicate an existing url', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await addActiveDownload(AUDIO_URL_A)

    const entries = await getActiveDownloads()
    expect(entries).toHaveLength(1)
    expect(entries[0].url).toBe(AUDIO_URL_A)
  })

  test('addActiveDownload keeps a row for this session even if another tab has the url', async () => {
    await AsyncStorage.setItem(
      ACTIVE_DOWNLOADS_KEY,
      JSON.stringify([{ lastSeenAt: 1, sessionId: 'other-tab', url: AUDIO_URL_A }]),
    )
    await addActiveDownload(AUDIO_URL_A)

    const entries = await getActiveDownloads()
    expect(entries).toHaveLength(2)
    expect(
      entries.filter(entry => entry.sessionId === sessionId && entry.url === AUDIO_URL_A),
    ).toHaveLength(1)
  })

  test('removeActiveDownload removes only this session row', async () => {
    await AsyncStorage.setItem(
      ACTIVE_DOWNLOADS_KEY,
      JSON.stringify([
        { lastSeenAt: 1, sessionId: 'other-tab', url: AUDIO_URL_A },
        { lastSeenAt: 1, sessionId, url: AUDIO_URL_A },
      ]),
    )
    await removeActiveDownload(AUDIO_URL_A)

    const entries = await getActiveDownloads()
    expect(entries).toEqual([expect.objectContaining({ sessionId: 'other-tab', url: AUDIO_URL_A })])
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

  test('migrates a legacy string[] payload into stale entries', async () => {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify([AUDIO_URL_A, AUDIO_URL_B]))

    const entries = await getActiveDownloads()

    expect(entries).toEqual([
      { lastSeenAt: 0, sessionId: 'legacy', url: AUDIO_URL_A },
      { lastSeenAt: 0, sessionId: 'legacy', url: AUDIO_URL_B },
    ])
  })

  test('clearActiveDownloads empties the journal', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await clearActiveDownloads()

    await expect(getActiveDownloads()).resolves.toEqual([])
  })

  test('refreshActiveDownload updates lastSeenAt for this session only', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await AsyncStorage.setItem(
      ACTIVE_DOWNLOADS_KEY,
      JSON.stringify([
        { lastSeenAt: 1, sessionId, url: AUDIO_URL_A },
        { lastSeenAt: 1, sessionId: 'other-tab', url: AUDIO_URL_B },
      ]),
    )

    await refreshActiveDownload(AUDIO_URL_A)

    const entries = await getActiveDownloads()
    expect(entries.find(entry => entry.url === AUDIO_URL_A)?.lastSeenAt).toBeGreaterThan(1)
    expect(entries.find(entry => entry.url === AUDIO_URL_B)?.lastSeenAt).toBe(1)
  })

  test('heartbeat refreshes lastSeenAt on interval and stops on cleanup', async () => {
    const stopHeartbeat = await addActiveDownloadWithHeartbeat(AUDIO_URL_A)
    const before = (await getActiveDownloads())[0].lastSeenAt

    await jest.advanceTimersByTimeAsync(10_000)

    const after = (await getActiveDownloads())[0].lastSeenAt
    expect(after).toBeGreaterThan(before)

    stopHeartbeat()
    const stopped = after
    await jest.advanceTimersByTimeAsync(10_000)
    expect((await getActiveDownloads())[0].lastSeenAt).toBe(stopped)
  })

  test('removeActiveDownloadEntries drops only the given urls', async () => {
    await addActiveDownload(AUDIO_URL_A)
    await addActiveDownload(AUDIO_URL_B)

    await removeActiveDownloadEntries([{ lastSeenAt: 0, sessionId, url: AUDIO_URL_A }])

    const entries = await getActiveDownloads()
    expect(entries.map(entry => entry.url)).toEqual([AUDIO_URL_B])
  })
})
