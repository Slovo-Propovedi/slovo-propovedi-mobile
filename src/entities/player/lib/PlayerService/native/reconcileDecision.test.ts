import {
  decideForegroundReconcile,
  type ForegroundEngineSummary,
  type ForegroundReconcileDecision,
} from './reconcileDecision'

const PLAYLIST_IDS = ['sermon-1', 'sermon-2', 'sermon-3']

const makeEngine = (overrides: Partial<ForegroundEngineSummary> = {}): ForegroundEngineSummary => ({
  currentIndex: 0,
  currentTrackId: 'sermon-1',
  durationMs: 120_000,
  isLoaded: true,
  loop: 'none',
  positionMs: 30_000,
  trackCount: PLAYLIST_IDS.length,
  ...overrides,
})

const decide = (
  engine: ForegroundEngineSummary,
  currentAudioId: null | string = 'sermon-1',
  playlistSermonIds: string[] = PLAYLIST_IDS,
): ForegroundReconcileDecision =>
  decideForegroundReconcile({ currentAudioId, engine, playlistSermonIds })

describe('decideForegroundReconcile', () => {
  test('completes the queue when the native engine finished the last track', () => {
    const engine = makeEngine({
      currentIndex: 2,
      currentTrackId: 'sermon-3',
      positionMs: 120_000,
    })

    expect(decide(engine, 'sermon-2')).toBe('idle-complete')
  })

  test('does not treat a looped queue as ended', () => {
    const engine = makeEngine({
      currentIndex: 2,
      currentTrackId: 'sermon-3',
      loop: 'all',
      positionMs: 120_000,
    })

    expect(decide(engine, 'sermon-3')).toBe('flush-current')
  })

  test('flushes when the engine still plays the sermon JS knows about', () => {
    expect(decide(makeEngine())).toBe('flush-current')
  })

  test('advances when the engine moved forward inside the same queue', () => {
    const engine = makeEngine({
      currentIndex: 2,
      currentTrackId: 'sermon-3',
      positionMs: 5_000,
    })

    expect(decide(engine, 'sermon-1')).toBe('advance')
  })

  test('falls back when the engine track is not in the JS queue', () => {
    const engine = makeEngine({ currentIndex: 1, currentTrackId: 'other-sermon' })

    expect(decide(engine, 'sermon-1')).toBe('fallback')
  })

  test('falls back when the JS track is not in its own queue', () => {
    const engine = makeEngine({ currentIndex: 2, currentTrackId: 'sermon-3' })

    expect(decide(engine, 'unknown-sermon')).toBe('fallback')
  })

  test('falls back on a repeat wrap / backward jump', () => {
    const engine = makeEngine({ currentIndex: 0, currentTrackId: 'sermon-1' })

    expect(decide(engine, 'sermon-2')).toBe('fallback')
  })

  test('falls back when the native queue is not loaded', () => {
    expect(decide(makeEngine({ isLoaded: false }))).toBe('fallback')
  })
})
