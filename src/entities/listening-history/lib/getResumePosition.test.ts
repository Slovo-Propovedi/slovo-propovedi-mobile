import { type ListeningHistory } from '../model/types'
import { getResumePosition } from './getResumePosition'

jest.mock('entities/player', () => {
  const z = jest.requireActual('zod').default
  return {
    audioPlayerDataSchema: z.object({
      artist: z.string(),
      artwork: z.string(),
      audioUrl: z.string(),
      id: z.string(),
      title: z.string(),
    }),
    toAudioPlayerData: (sermon?: { audioUrl?: null | string } | null) =>
      sermon?.audioUrl ? sermon : null,
  }
})

const makeEntries = (overrides: Record<string, unknown> = {}): ListeningHistory => [
  {
    durationMs: 3_600_000,
    lastPlayedAt: 100,
    playlist: {
      artwork: 'art.jpg',
      id: 'pl-1',
      sermons: [],
      title: 'Playlist',
    },
    positionMs: 1_800_000,
    sermon: {
      artist: 'Author',
      artwork: 'sermon.jpg',
      audioUrl: 'https://example.com/audio.mp3',
      id: 'sermon-1',
      title: 'Sermon',
    },
    ...overrides,
  },
]

describe('getResumePosition', () => {
  test('returns 0 when no entries exist', () => {
    expect(getResumePosition([], 'sermon-1')).toBe(0)
  })

  test('returns 0 when entry is completed', () => {
    const entries = makeEntries({ durationMs: 3_600_000, positionMs: 3_595_000 })
    expect(getResumePosition(entries, 'sermon-1')).toBe(0)
  })

  test('returns positionMs for partial entry', () => {
    const entries = makeEntries({ durationMs: 3_600_000, positionMs: 1_800_000 })
    expect(getResumePosition(entries, 'sermon-1')).toBe(1_800_000)
  })

  test('returns 0 when positionMs is 0', () => {
    const entries = makeEntries({ durationMs: 3_600_000, positionMs: 0 })
    expect(getResumePosition(entries, 'sermon-1')).toBe(0)
  })

  test('returns 0 for unknown sermon id', () => {
    const entries = makeEntries()
    expect(getResumePosition(entries, 'unknown-id')).toBe(0)
  })

  test('returns 0 when durationMs is 0 (not started)', () => {
    const entries = makeEntries({ durationMs: 0, positionMs: 0 })
    expect(getResumePosition(entries, 'sermon-1')).toBe(0)
  })
})
