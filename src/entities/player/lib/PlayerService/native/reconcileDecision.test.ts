import {
  decideForegroundReconcile,
  type ForegroundEngineSummary,
  type ForegroundReconcileDecision,
} from './reconcileDecision'

const QUEUE_IDS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']
const LAST_ID = 's8'
const FLUSH_CURRENT = { type: 'flush-current' } as const

const makeEngine = (overrides: Partial<ForegroundEngineSummary> = {}): ForegroundEngineSummary => ({
  autoAdvanceCount: null,
  currentIndex: 0,
  currentTrackId: QUEUE_IDS[0],
  didJustFinish: false,
  durationMs: 120_000,
  engineTrackIds: QUEUE_IDS,
  isLoaded: true,
  loop: 'none',
  positionMs: 30_000,
  trackCount: QUEUE_IDS.length,
  ...overrides,
})

const decide = (
  engine: ForegroundEngineSummary,
  currentAudioId: null | string = QUEUE_IDS[0],
  {
    jsKnownAutoAdvanceCount = engine.autoAdvanceCount,
    playlistSermonIds = QUEUE_IDS,
  }: { jsKnownAutoAdvanceCount?: null | number; playlistSermonIds?: string[] } = {},
): ForegroundReconcileDecision =>
  decideForegroundReconcile({
    currentAudioId,
    engine,
    jsKnownAutoAdvanceCount,
    playlistSermonIds,
  })

const counterEngine = (overrides: Partial<ForegroundEngineSummary> = {}) =>
  makeEngine({ autoAdvanceCount: 5, ...overrides })

describe('decideForegroundReconcile — queue end', () => {
  test('completes the queue on the last track near its end', () => {
    const engine = makeEngine({
      currentIndex: 7,
      currentTrackId: LAST_ID,
      positionMs: 119_000,
    })

    expect(decide(engine, 's7')).toEqual({ type: 'idle-complete' })
  })

  test('completes the queue on a genuine didJustFinish even far from the end', () => {
    const engine = makeEngine({
      currentIndex: 7,
      currentTrackId: LAST_ID,
      didJustFinish: true,
      positionMs: 5_000,
    })

    expect(decide(engine, 's7')).toEqual({ type: 'idle-complete' })
  })

  test('does not treat a looped queue as ended', () => {
    const engine = makeEngine({
      currentIndex: 7,
      currentTrackId: LAST_ID,
      loop: 'all',
      positionMs: 120_000,
    })

    expect(decide(engine, LAST_ID)).toEqual(FLUSH_CURRENT)
  })
})

describe('decideForegroundReconcile — legacy binaries (no counter)', () => {
  test('advances linearly when the engine moved forward', () => {
    const engine = makeEngine({ currentIndex: 2, currentTrackId: 's3', positionMs: 5_000 })

    expect(decide(engine, 's1')).toEqual({
      completeRanges: [[0, 1]],
      switchTo: 2,
      type: 'advance',
    })
  })

  test('falls back on a backward jump', () => {
    expect(decide(makeEngine({ currentIndex: 0 }), 's3')).toEqual({ type: 'fallback' })
  })

  test('stays on the legacy path when only the native counter is known', () => {
    const engine = makeEngine({
      autoAdvanceCount: 4,
      currentIndex: 2,
      currentTrackId: 's3',
      positionMs: 5_000,
    })

    expect(decide(engine, 's1', { jsKnownAutoAdvanceCount: null })).toEqual({
      completeRanges: [[0, 1]],
      switchTo: 2,
      type: 'advance',
    })
  })

  test('stays on the legacy path when only the JS counter is known', () => {
    const engine = makeEngine({ currentIndex: 2, currentTrackId: 's3', positionMs: 5_000 })

    expect(decide(engine, 's1', { jsKnownAutoAdvanceCount: 5 })).toEqual({
      completeRanges: [[0, 1]],
      switchTo: 2,
      type: 'advance',
    })
  })
})

describe('decideForegroundReconcile — manual hop (delta 0)', () => {
  test('switches forward without completing anything', () => {
    const engine = counterEngine({ currentIndex: 5, currentTrackId: 's6' })

    expect(decide(engine, 's2')).toEqual({ switchTo: 5, type: 'advance-manual' })
  })

  test('switches backward without completing anything', () => {
    const engine = counterEngine({ currentIndex: 1, currentTrackId: 's2' })

    expect(decide(engine, 's6')).toEqual({ switchTo: 1, type: 'advance-manual' })
  })
})

describe('decideForegroundReconcile — auto chain (delta > 0)', () => {
  test('completes a linear chain', () => {
    const engine = counterEngine({ currentIndex: 2, currentTrackId: 's3' })

    expect(decide(engine, 's1', { jsKnownAutoAdvanceCount: 3 })).toEqual({
      completeRanges: [[0, 1]],
      switchTo: 2,
      type: 'advance',
    })
  })

  test('completes a wrap chain within a single range ending at the last index', () => {
    const engine = counterEngine({ currentIndex: 0, currentTrackId: 's1' })

    expect(decide(engine, 's6', { jsKnownAutoAdvanceCount: 2 })).toEqual({
      completeRanges: [[5, 7]],
      switchTo: 0,
      type: 'advance',
    })
  })

  test('completes a wrap chain spanning several ranges', () => {
    const engine = counterEngine({ currentIndex: 3, currentTrackId: 's4' })

    expect(decide(engine, 's6', { jsKnownAutoAdvanceCount: -1 })).toEqual({
      completeRanges: [
        [5, 7],
        [0, 2],
      ],
      switchTo: 3,
      type: 'advance',
    })
  })

  test('treats a full-cycle delta back to the same sermon as flush-current', () => {
    const engine = counterEngine({ currentIndex: 5, currentTrackId: 's6' })

    expect(decide(engine, 's6', { jsKnownAutoAdvanceCount: -3 })).toEqual({
      type: 'flush-current',
    })
  })

  test('falls back when the delta cannot reproduce the engine index (mixed manual+auto)', () => {
    const engine = counterEngine({ currentIndex: 0, currentTrackId: 's1' })

    expect(decide(engine, 's6', { jsKnownAutoAdvanceCount: 3 })).toEqual({ type: 'fallback' })
  })

  test('falls back when the native counter went backwards', () => {
    const engine = makeEngine({ autoAdvanceCount: 4, currentIndex: 2, currentTrackId: 's3' })

    expect(decide(engine, 's1', { jsKnownAutoAdvanceCount: 5 })).toEqual({ type: 'fallback' })
  })
})

describe('decideForegroundReconcile — guards', () => {
  test('flushes when the engine still plays the sermon JS knows about', () => {
    expect(decide(makeEngine(), 's1')).toEqual(FLUSH_CURRENT)
  })

  test('repeat-single on the same id stays flush-current', () => {
    const engine = counterEngine({ currentIndex: 3, currentTrackId: 's4', loop: 'single' })

    expect(decide(engine, 's4')).toEqual(FLUSH_CURRENT)
  })

  test('falls back when the engine track is not in the JS queue', () => {
    const engine = makeEngine({ currentIndex: 1, currentTrackId: 'other-sermon' })

    expect(decide(engine, 's1')).toEqual({ type: 'fallback' })
  })

  test('falls back when the JS track is not in its own queue', () => {
    expect(decide(makeEngine({ currentIndex: 2, currentTrackId: 's3' }), 'unknown-sermon')).toEqual(
      {
        type: 'fallback',
      },
    )
  })

  test('falls back when the engine queue identity differs from the JS queue', () => {
    const engine = makeEngine({
      autoAdvanceCount: 5,
      currentIndex: 2,
      currentTrackId: 's3',
      engineTrackIds: QUEUE_IDS.slice(0, -1),
      trackCount: QUEUE_IDS.length - 1,
    })

    expect(decide(engine, 's1')).toEqual({ type: 'fallback' })
  })

  test('falls back when the native queue is not loaded', () => {
    expect(decide(makeEngine({ isLoaded: false }))).toEqual({ type: 'fallback' })
  })

  test('falls back on an empty queue', () => {
    const engine = makeEngine({ engineTrackIds: [], trackCount: 0 })

    expect(decide(engine, 's1', { playlistSermonIds: [] })).toEqual({ type: 'fallback' })
  })
})
