import AsyncStorage from '@react-native-async-storage/async-storage'
import { type PlaylistData, playlistDataSchema } from 'entities/playlist/@x/player'
import { mapPlaylistEntityToPlaylistData } from 'entities/playlist/lib/mappers/mapPlaylistEntityToPlaylistData'
import { type AudioPlayerData, audioPlayerDataSchema } from 'entities/sermon/@x/player'
import { mapSermonEntityToSermonData } from 'entities/sermon/lib/mappers/mapSermonEntityToSermonData'
import { playlistsMocks, sermonsMocks } from 'shared/api/generated'
import { CURRENT_AUDIO, CURRENT_PLAYLIST } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { getParseJsonWithSchema } from 'shared/model'
import { setCurrentAudioAction, setCurrentPlaylistAction } from '../model'

const parseStoredAudio = getParseJsonWithSchema(audioPlayerDataSchema)
const parseStoredPlaylist = getParseJsonWithSchema(playlistDataSchema)

const BASE_AUDIO: AudioPlayerData = {
  artist: 'Author',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Test Sermon',
}

const buildNestedPlaylist = () => ({
  artwork: null,
  id: 'playlist-1',
  sermons: [
    {
      artist: 'Nested',
      artwork: null,
      audioUrl: 'https://example.com/nested.mp3',
      id: 'nested-1',
      title: 'Nested sermon',
    },
  ],
  title: 'Nested playlist',
})

const readRaw = async (key: string): Promise<Record<string, unknown>> => {
  const stored = await AsyncStorage.getItem(key)

  return JSON.parse(stored ?? '{}')
}

// The writer persists, the reader parses: both must agree on the stored shape.
const writeThenRestoreAudio = async (
  audio: AudioPlayerData,
): Promise<AudioPlayerData | undefined> => {
  const written = await setCurrentAudioAction(ctx, audio)
  const restored = parseStoredAudio(await AsyncStorage.getItem(CURRENT_AUDIO))

  expect(restored).toEqual(written)

  return restored
}

describe('player storage round-trip (save ↔ restore)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  test('round-trips a minimal record with absent optional fields', async () => {
    expect(await writeThenRestoreAudio(BASE_AUDIO)).toEqual(BASE_AUDIO)
  })

  test('keeps null artwork as an honest null', async () => {
    expect((await writeThenRestoreAudio({ ...BASE_AUDIO, artwork: null }))?.artwork).toBeNull()
  })

  test('normalizes missing artwork to null so the required key survives JSON', async () => {
    const audio = { ...BASE_AUDIO }
    Reflect.deleteProperty(audio, 'artwork')

    const restored = await writeThenRestoreAudio(audio)

    expect(await readRaw(CURRENT_AUDIO)).toHaveProperty('artwork', null)
    expect(restored?.artwork).toBeNull()
  })

  test('drops heavy nested playlists before persisting', async () => {
    const restored = await writeThenRestoreAudio({
      ...BASE_AUDIO,
      playlists: [buildNestedPlaylist()],
    })

    expect(await readRaw(CURRENT_AUDIO)).not.toHaveProperty('playlists')
    expect(restored?.playlists).toBeUndefined()
  })

  test('restores despite a nested playlist whose sermon lost its artwork key', async () => {
    const nestedPlaylist = buildNestedPlaylist()
    Reflect.deleteProperty(nestedPlaylist.sermons[0], 'artwork')
    const audio = { ...BASE_AUDIO, playlists: [nestedPlaylist] }
    const rawShape = audioPlayerDataSchema.safeParse(JSON.parse(JSON.stringify(audio)))

    // Documented previously-failing shape: persisting it as-is is rejected.
    expect(rawShape.success).toBe(false)

    expect(await writeThenRestoreAudio(audio)).not.toBeUndefined()
  })

  test('round-trips a mapped SermonEntity whose artwork the server omitted', async () => {
    const entity = sermonsMocks.getSermonControllerFindOneResponseMock()
    Reflect.deleteProperty(entity, 'artwork')
    const audio: AudioPlayerData = {
      ...mapSermonEntityToSermonData(entity),
      audioUrl: 'https://example.com/a.mp3',
    }

    expect(audio.artwork).toBeNull()
    expect((await writeThenRestoreAudio(audio))?.artwork).toBeNull()
  })

  test('round-trips a mapped playlist whose sermon artwork the server omitted', async () => {
    const entity = playlistsMocks.getPlaylistControllerFindOneResponseMock()
    const firstSermon = entity.sermons[0]
    if (!firstSermon) throw new Error('faker must return at least one sermon')
    Reflect.deleteProperty(firstSermon, 'artwork')
    Object.assign(entity, { description: null })

    const written = await setCurrentPlaylistAction(ctx, mapPlaylistEntityToPlaylistData(entity))
    const restored: PlaylistData | undefined = parseStoredPlaylist(
      await AsyncStorage.getItem(CURRENT_PLAYLIST),
    )

    expect(restored).toEqual(written)
  })
})
