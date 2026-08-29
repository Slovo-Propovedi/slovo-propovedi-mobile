import AsyncStorage from '@react-native-async-storage/async-storage'
import { historyAtom, type ListeningHistory } from 'entities/listening-history/@x/player'
import { CURRENT_SOUND_POSITION, LISTENING_HISTORY } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { currentAudioAtom, durationAtom } from '../../model'
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
})
