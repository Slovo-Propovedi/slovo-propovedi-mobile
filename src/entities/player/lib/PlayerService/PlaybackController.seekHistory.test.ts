import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer } from 'expo-audio'
import { historyAtom, type ListeningHistory } from 'entities/listening-history/@x/player'
import { LISTENING_HISTORY } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { currentAudioAtom, durationAtom } from '../../model'
import { playbackController } from './PlaybackController'

const createPlayerStub = (): AudioPlayer =>
  ({ isLoaded: true, seekTo: jest.fn().mockResolvedValue(undefined) }) as unknown as AudioPlayer

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

describe('PlaybackController seek history flush', () => {
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

  test('seekTo on pause flushes history position after debounce', async () => {
    const player = createPlayerStub()

    await playbackController.seekTo(player, 60000)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].positionMs).toBe(60000)

    const stored = JSON.parse(
      (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
    ) as ListeningHistory
    expect(stored[0].positionMs).toBe(60000)
  })

  test('series of seeks faster than debounce → single final write', async () => {
    const player = createPlayerStub()

    await playbackController.seekTo(player, 10000)
    await playbackController.seekTo(player, 20000)
    await playbackController.seekTo(player, 30000)

    await jest.advanceTimersByTimeAsync(200)
    expect(ctx.get(historyAtom)[0].positionMs).toBe(10000)

    await jest.advanceTimersByTimeAsync(200)
    expect(ctx.get(historyAtom)[0].positionMs).toBe(30000)

    const stored = JSON.parse(
      (await AsyncStorage.getItem(LISTENING_HISTORY)) ?? '[]',
    ) as ListeningHistory
    expect(stored[0].positionMs).toBe(30000)
  })

  test('durationMs is captured at schedule time, not at flush time', async () => {
    const player = createPlayerStub()

    await playbackController.seekTo(player, 60000)

    // Track switch within the debounce window changes the duration
    durationAtom(ctx, 200000)

    await jest.advanceTimersByTimeAsync(400)

    expect(ctx.get(historyAtom)[0].durationMs).toBe(100000)
  })
})
