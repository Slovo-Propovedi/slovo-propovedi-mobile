import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { historyAtom, type ListeningHistory } from 'entities/listening-history/@x/player'
import { type PlaylistData } from 'entities/playlist/@x/player'
import { type AudioPlayerData } from 'entities/sermon/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_SOUND_POSITION } from 'shared/config'
import { isBarCollapsedAtom } from 'shared/ui/layout'
import { currentAudioAtom, currentPlaylistAtom } from './model'
import { isPlayerExpandedAtom } from './playerSheet'
import { resetPlayerState } from './resetPlayback'

const SERMON_ID = 'sermon-1'

const makeSermon = (id: string): AudioPlayerData => ({
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id,
  title: 'Test Sermon',
})

const PLAYLIST: PlaylistData = {
  artwork: null,
  id: 'playlist-1',
  sermons: [makeSermon(SERMON_ID)],
  title: 'Playlist',
}

const makeEntry = (sermonId: string): ListeningHistory[number] => ({
  durationMs: 1000,
  lastPlayedAt: Date.now(),
  playlist: { ...PLAYLIST, sermons: [makeSermon(sermonId)] },
  positionMs: 500,
  sermon: makeSermon(sermonId),
})

describe('resetPlayerState', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  test('clears player state, stored keys and the listening-history entry', async () => {
    const ctx = createCtx()
    currentAudioAtom(ctx, makeSermon(SERMON_ID))
    currentPlaylistAtom(ctx, PLAYLIST)
    historyAtom(ctx, [makeEntry(SERMON_ID)])
    await AsyncStorage.setItem(CURRENT_AUDIO, JSON.stringify(makeSermon(SERMON_ID)))
    await AsyncStorage.setItem(CURRENT_PLAYLIST, JSON.stringify(PLAYLIST))
    await AsyncStorage.setItem(CURRENT_SOUND_POSITION, JSON.stringify({ sermonId: SERMON_ID }))

    await resetPlayerState(ctx)

    expect(ctx.get(currentAudioAtom)).toBeNull()
    expect(ctx.get(currentPlaylistAtom)).toBeNull()
    expect(await AsyncStorage.getItem(CURRENT_AUDIO)).toBeNull()
    expect(await AsyncStorage.getItem(CURRENT_PLAYLIST)).toBeNull()
    expect(await AsyncStorage.getItem(CURRENT_SOUND_POSITION)).toBeNull()
    expect(ctx.get(historyAtom)).toHaveLength(0)
  })

  test('leaves the listening history untouched when no sermon is loaded', async () => {
    const ctx = createCtx()
    historyAtom(ctx, [makeEntry(SERMON_ID)])

    await resetPlayerState(ctx)

    expect(ctx.get(currentAudioAtom)).toBeNull()
    expect(ctx.get(historyAtom)).toHaveLength(1)
  })

  test('collapses the fullscreen player on reset', async () => {
    const ctx = createCtx()
    isPlayerExpandedAtom(ctx, true)
    currentAudioAtom(ctx, makeSermon(SERMON_ID))
    historyAtom(ctx, [makeEntry(SERMON_ID)])

    await resetPlayerState(ctx)

    expect(ctx.get(isPlayerExpandedAtom)).toBe(false)
  })

  test('expands the bottom bar on reset', async () => {
    const ctx = createCtx()
    isBarCollapsedAtom(ctx, true)
    currentAudioAtom(ctx, makeSermon(SERMON_ID))
    historyAtom(ctx, [makeEntry(SERMON_ID)])

    await resetPlayerState(ctx)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
  })
})
