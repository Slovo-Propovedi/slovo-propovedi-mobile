import { ctx } from '../reatom-ctx'
import { activeCacheUrlAtom, cacheQueueAtom } from './cacheQueueState'
import { isUrlQueuedOrActive } from './isUrlQueuedOrActive'

const URL = 'https://example.com/audio.mp3'

describe('isUrlQueuedOrActive', () => {
  beforeEach(() => {
    cacheQueueAtom(ctx, {})
    activeCacheUrlAtom(ctx, null)
  })

  test('true while the URL waits in the serial queue', () => {
    cacheQueueAtom(ctx, { [URL]: { enqueuedAt: Date.now(), source: 'auto' } })

    expect(isUrlQueuedOrActive(URL)).toBe(true)
  })

  test('true while the URL is the active download', () => {
    activeCacheUrlAtom(ctx, URL)

    expect(isUrlQueuedOrActive(URL)).toBe(true)
  })

  test('false when the URL is neither queued nor active', () => {
    expect(isUrlQueuedOrActive(URL)).toBe(false)
  })
})
