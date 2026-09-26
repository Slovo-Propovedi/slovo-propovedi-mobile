import { resolveCacheState, type ResolveCacheStateInput } from './resolveCacheState'

const allFalse: ResolveCacheStateInput = {
  isCached: false,
  isDownloading: false,
  isPlaying: false,
  isQueued: false,
}

describe('resolveCacheState', () => {
  describe('single-flag states', () => {
    test('returns cloud when nothing is set', () => {
      expect(resolveCacheState(allFalse)).toBe('cloud')
    })

    test('returns playing when isPlaying is true', () => {
      expect(resolveCacheState({ ...allFalse, isPlaying: true })).toBe('playing')
    })

    test('returns downloading when isDownloading is true', () => {
      expect(resolveCacheState({ ...allFalse, isDownloading: true })).toBe('downloading')
    })

    test('returns queued when isQueued is true', () => {
      expect(resolveCacheState({ ...allFalse, isQueued: true })).toBe('queued')
    })

    test('returns cached when isCached is true', () => {
      expect(resolveCacheState({ ...allFalse, isCached: true })).toBe('cached')
    })
  })

  describe('precedence conflicts', () => {
    test('playing beats downloading', () => {
      expect(
        resolveCacheState({
          isCached: false,
          isDownloading: true,
          isPlaying: true,
          isQueued: false,
        }),
      ).toBe('playing')
    })

    test('playing beats queued', () => {
      expect(
        resolveCacheState({
          isCached: false,
          isDownloading: false,
          isPlaying: true,
          isQueued: true,
        }),
      ).toBe('playing')
    })

    test('playing beats cached', () => {
      expect(
        resolveCacheState({
          isCached: true,
          isDownloading: false,
          isPlaying: true,
          isQueued: false,
        }),
      ).toBe('playing')
    })

    test('playing beats cloud (all flags)', () => {
      expect(
        resolveCacheState({ isCached: true, isDownloading: true, isPlaying: true, isQueued: true }),
      ).toBe('playing')
    })

    test('downloading beats queued', () => {
      expect(
        resolveCacheState({
          isCached: false,
          isDownloading: true,
          isPlaying: false,
          isQueued: true,
        }),
      ).toBe('downloading')
    })

    test('downloading beats cached', () => {
      expect(
        resolveCacheState({
          isCached: true,
          isDownloading: true,
          isPlaying: false,
          isQueued: false,
        }),
      ).toBe('downloading')
    })

    test('downloading beats cloud', () => {
      expect(
        resolveCacheState({
          isCached: false,
          isDownloading: true,
          isPlaying: false,
          isQueued: false,
        }),
      ).toBe('downloading')
    })

    test('cached beats queued — cache entry is truthy, queue entry is redundant', () => {
      // enqueueCache deduplicates by queued/inflight status, not by cached.
      // A URL that is already cached can be re-enqueued (e.g. "cache all" sweep
      // re-enqueues everything before checking). When both flags are true the
      // row IS cached and the queue entry is semantically redundant.
      expect(
        resolveCacheState({
          isCached: true,
          isDownloading: false,
          isPlaying: false,
          isQueued: true,
        }),
      ).toBe('cached')
    })

    test('queued beats cloud', () => {
      expect(
        resolveCacheState({
          isCached: false,
          isDownloading: false,
          isPlaying: false,
          isQueued: true,
        }),
      ).toBe('queued')
    })

    test('cached beats cloud', () => {
      expect(
        resolveCacheState({
          isCached: true,
          isDownloading: false,
          isPlaying: false,
          isQueued: false,
        }),
      ).toBe('cached')
    })

    test('downloading beats cached+queued', () => {
      expect(
        resolveCacheState({
          isCached: true,
          isDownloading: true,
          isPlaying: false,
          isQueued: true,
        }),
      ).toBe('downloading')
    })
  })
})
