import { hasInflightCacheDownloads, inflightCache, resetInflightCache } from './inflightCache'

describe('hasInflightCacheDownloads', () => {
  beforeEach(() => {
    resetInflightCache()
  })

  test('returns false when no downloads are in-flight', () => {
    expect(hasInflightCacheDownloads()).toBe(false)
  })

  test('returns true when at least one download is in-flight', () => {
    inflightCache.set('http://example.com/1.mp3', {
      callbacks: new Set(),
      emit: () => {},
      lastValue: 0,
      promise: Promise.resolve('http://example.com/1.mp3'),
    })

    expect(hasInflightCacheDownloads()).toBe(true)
  })

  test('returns false after the in-flight download is removed', () => {
    inflightCache.set('http://example.com/1.mp3', {
      callbacks: new Set(),
      emit: () => {},
      lastValue: 0,
      promise: Promise.resolve('http://example.com/1.mp3'),
    })
    inflightCache.delete('http://example.com/1.mp3')

    expect(hasInflightCacheDownloads()).toBe(false)
  })
})
