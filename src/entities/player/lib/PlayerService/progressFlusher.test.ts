import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getEntrySermon,
  historyAtom,
  type ListeningHistory,
} from 'entities/listening-history/@x/player'
import { CURRENT_SOUND_POSITION, LISTENING_HISTORY } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { currentAudioAtom, currentPlaylistAtom, durationAtom } from '../../model'
import { cancelScheduledHistoryFlush, flushProgress, scheduleHistoryFlush } from './progressFlusher'

const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const mockPlaylist: PlaylistData = {
  artwork: 'playlist.jpg',
  description: 'A test playlist',
  id: 'pl-1',
  sermons: [mockAudio],
  title: 'Test Playlist',
}

const makeEntry = (positionMs: number): ListeningHistory[number] => ({
  durationMs: 100000,
  lastPlayedAt: Date.now(),
  playlist: mockPlaylist,
  positionMs,
})

const readStoredHistory = async (): Promise<ListeningHistory> =>
  JSON.parse((await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]') as ListeningHistory

describe('progressFlusher', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    void AsyncStorage.clear()
    historyAtom(ctx, [makeEntry(10000)])
    currentAudioAtom(ctx, mockAudio)
    currentPlaylistAtom(ctx, mockPlaylist)
    durationAtom(ctx, 100000)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('scheduleHistoryFlush early-returns without currentAudio', async () => {
    currentAudioAtom(ctx, null)

    scheduleHistoryFlush(60000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)
    expect(await AsyncStorage.getItem(LISTENING_HISTORY)).toBeNull()
  })

  test('flushProgress early-returns without currentAudio', async () => {
    currentAudioAtom(ctx, null)

    flushProgress(60000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)
    expect(await AsyncStorage.getItem(LISTENING_HISTORY)).toBeNull()
  })

  test('series of schedules within debounce window → single final write', async () => {
    scheduleHistoryFlush(10000)
    scheduleHistoryFlush(20000)
    scheduleHistoryFlush(30000)

    await jest.advanceTimersByTimeAsync(200)
    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)

    await jest.advanceTimersByTimeAsync(200)
    expect(ctx.get(historyAtom)[0].positionMs).toBe(30000)

    expect((await readStoredHistory())[0].positionMs).toBe(30000)
  })

  test('durationMs is captured at schedule time, not at flush time', async () => {
    scheduleHistoryFlush(60000)

    durationAtom(ctx, 200000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].durationMs).toBe(100000)
  })

  test('cancelScheduledHistoryFlush drops the pending write', async () => {
    scheduleHistoryFlush(60000)

    cancelScheduledHistoryFlush()

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)
    expect(await AsyncStorage.getItem(LISTENING_HISTORY)).toBeNull()
  })

  test('flushProgress cancels pending debounce and writes current values', async () => {
    scheduleHistoryFlush(10000)

    flushProgress(60000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(60000)
    expect((await readStoredHistory())[0].positionMs).toBe(60000)

    const progress = JSON.parse((await AsyncStorage.getItem(CURRENT_SOUND_POSITION)) ?? '{}') as {
      positionMs: number
      sermonId: string
    }
    expect(progress.positionMs).toBe(60000)
    expect(progress.sermonId).toBe('sermon-1')
  })

  test('flushProgress creates a missing entry with the current playlist', async () => {
    historyAtom(ctx, [])

    flushProgress(60000)

    await jest.advanceTimersByTimeAsync(400)

    const atomState = ctx.get(historyAtom)
    expect(atomState).toHaveLength(1)
    expect(atomState[0].positionMs).toBe(60000)
    expect(atomState[0].playlist.id).toBe('pl-1')
  })

  test('scheduleHistoryFlush skips completed entries while flushProgress updates them', async () => {
    historyAtom(ctx, [makeEntry(100000)])

    scheduleHistoryFlush(60000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(100000)

    flushProgress(60000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(60000)
  })

  test('capture-at-schedule pins sermon across a switch inside debounce window', async () => {
    const sermonA: AudioPlayerData = { ...mockAudio, id: 'sermon-a', title: 'Sermon A' }
    const playlistA: PlaylistData = {
      ...mockPlaylist,
      id: 'pl-a',
      sermons: [sermonA],
      title: 'Playlist A',
    }

    historyAtom(ctx, [])
    currentAudioAtom(ctx, sermonA)
    currentPlaylistAtom(ctx, playlistA)

    scheduleHistoryFlush(50000)

    // Switch to sermon B before the debounce fires
    const sermonB: AudioPlayerData = { ...mockAudio, id: 'sermon-b', title: 'Sermon B' }
    const playlistB: PlaylistData = {
      ...mockPlaylist,
      id: 'pl-b',
      sermons: [sermonB],
      title: 'Playlist B',
    }
    currentAudioAtom(ctx, sermonB)
    currentPlaylistAtom(ctx, playlistB)

    await jest.advanceTimersByTimeAsync(400)

    // History should contain entry for sermon A (captured at schedule time), NOT sermon B
    const history = ctx.get(historyAtom)
    const entryA = history.find(e => getEntrySermon(e)?.id === 'sermon-a')
    const entryB = history.find(e => getEntrySermon(e)?.id === 'sermon-b')

    expect(entryA).toBeDefined()
    expect(entryA?.positionMs).toBe(50000)
    expect(entryB).toBeUndefined()

    // Persisted storage should also reflect sermon A
    const stored = await readStoredHistory()
    expect(stored).toHaveLength(1)
    expect(stored[0].playlist.sermons[0].id).toBe('sermon-a')
  })
})
