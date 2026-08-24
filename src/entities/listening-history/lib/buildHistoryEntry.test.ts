import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { listeningHistoryEntrySchema } from '../model/types'
import { buildHistoryEntry } from './buildHistoryEntry'

const mockAudio: AudioPlayerData = {
  artist: 'Author',
  artwork: 'sermon.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  playlists: [
    {
      artwork: 'pl.jpg',
      id: 'pl-1',
      sermons: [],
      title: 'Original Playlist',
    },
  ],
  title: 'Test Sermon',
}

const mockPlaylist: PlaylistData = {
  artwork: 'playlist.jpg',
  description: 'A test playlist',
  id: 'pl-1',
  sermons: [mockAudio],
  title: 'Test Playlist',
}

describe('buildHistoryEntry', () => {
  const NOW = 1700000000000
  const entry = buildHistoryEntry(mockAudio, mockPlaylist, NOW)

  test('strips playlists from sermon', () => {
    const sermon = entry.playlist.sermons[0]
    expect(sermon).not.toHaveProperty('playlists')
    expect('playlists' in sermon).toBe(false)
  })

  test('entry has no top-level sermon field (slim)', () => {
    expect(entry).not.toHaveProperty('sermon')
  })

  test('playlist contains single sermon', () => {
    expect(entry.playlist.sermons).toHaveLength(1)
    expect(entry.playlist.sermons[0].id).toBe('sermon-1')
  })

  test('context playlist preserves id, title, artwork, description', () => {
    expect(entry.playlist.id).toBe('pl-1')
    expect(entry.playlist.title).toBe('Test Playlist')
    expect(entry.playlist.artwork).toBe('playlist.jpg')
    expect(entry.playlist.description).toBe('A test playlist')
  })

  test('sets positionMs and durationMs to 0', () => {
    expect(entry.positionMs).toBe(0)
    expect(entry.durationMs).toBe(0)
  })

  test('sets lastPlayedAt to provided timestamp', () => {
    expect(entry.lastPlayedAt).toBe(NOW)
  })

  test('JSON.stringify succeeds with bounded size', () => {
    const json = JSON.stringify(entry)
    expect(typeof json).toBe('string')
    expect(json.length).toBeLessThan(1000)
  })

  test('entry passes listeningHistoryEntrySchema validation', () => {
    const result = listeningHistoryEntrySchema.safeParse(entry)
    expect(result.success).toBe(true)
  })
})
