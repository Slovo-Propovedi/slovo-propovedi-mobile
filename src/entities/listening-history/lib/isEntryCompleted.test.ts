import { type ListeningHistoryEntry } from '../model/types'
import { isEntryCompleted } from './isEntryCompleted'

const makeEntry = (overrides: Partial<ListeningHistoryEntry> = {}): ListeningHistoryEntry => ({
  durationMs: 3_600_000,
  lastPlayedAt: Date.now(),
  playlist: {
    artwork: 'art.jpg',
    id: 'pl-1',
    sermons: [],
    title: 'Test Playlist',
  },
  positionMs: 0,
  sermon: {
    artist: 'Author',
    artwork: 'sermon.jpg',
    audioUrl: 'https://example.com/audio.mp3',
    id: 'sermon-1',
    title: 'Test Sermon',
  },
  ...overrides,
})

describe('isEntryCompleted', () => {
  test('returns false when more than 10s remain on a long track', () => {
    const entry = makeEntry({ durationMs: 3_600_000, positionMs: 3_500_000 })
    expect(isEntryCompleted(entry)).toBe(false)
  })

  test('returns true when 10s or fewer remain on a long track', () => {
    const entry = makeEntry({ durationMs: 3_600_000, positionMs: 3_590_000 })
    expect(isEntryCompleted(entry)).toBe(true)
  })

  test('returns true when positionMs equals durationMs on a long track', () => {
    const entry = makeEntry({ durationMs: 3_600_000, positionMs: 3_600_000 })
    expect(isEntryCompleted(entry)).toBe(true)
  })

  test('returns true when a short track reaches its full duration', () => {
    const entry = makeEntry({ durationMs: 5_000, positionMs: 5_000 })
    expect(isEntryCompleted(entry)).toBe(true)
  })

  test('returns false when a short track is only partially played', () => {
    const entry = makeEntry({ durationMs: 5_000, positionMs: 2_000 })
    expect(isEntryCompleted(entry)).toBe(false)
  })

  test('returns false when durationMs is 0', () => {
    const entry = makeEntry({ durationMs: 0, positionMs: 0 })
    expect(isEntryCompleted(entry)).toBe(false)
  })

  test('returns false when durationMs is negative', () => {
    const entry = makeEntry({ durationMs: -100, positionMs: 0 })
    expect(isEntryCompleted(entry)).toBe(false)
  })
})
