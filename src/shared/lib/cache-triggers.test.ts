import { createCtx } from '@reatom/framework'
import { type PlaylistData, type SermonData } from 'shared/model'
import type { Ctx } from '@reatom/framework'
import { offlineRegistryAtom, registerOfflineSermon } from './audio-cache/offlineSermonsRegistry'
import {
  cachedUrlsAtom,
  cacheUpdateTriggerAtom,
  clearCachedUrls,
  incrementCacheTrigger,
  markUrlCached,
  markUrlEvicted,
  playlistDownloadProgressAtom,
  removeTrackDownloadProgress,
  setTrackDownloadProgress,
} from './cache-triggers'

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_AUDIO_URL = 'https://example.com/other.mp3'

const mockSermon: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [mockSermon],
  title: 'Playlist 1',
}

describe('cacheUpdateTriggerAtom', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('has initial value of 0', () => {
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(0)
  })

  test('incrementCacheTrigger increments by 1', () => {
    incrementCacheTrigger(ctx)
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(1)
  })

  test('incrementCacheTrigger accumulates across calls', () => {
    incrementCacheTrigger(ctx)
    incrementCacheTrigger(ctx)
    incrementCacheTrigger(ctx)
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(3)
  })
})

describe('playlistDownloadProgressAtom', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('has initial value of empty object', () => {
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('can be updated with download progress', () => {
    const progress = { 'https://example.com/audio.mp3': 0.5 }
    playlistDownloadProgressAtom(ctx, progress)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual(progress)
  })

  test('can track multiple tracks independently', () => {
    const first = { 'https://example.com/1.mp3': 0.3 }
    const second = { 'https://example.com/1.mp3': 0.3, 'https://example.com/2.mp3': 0.8 }
    playlistDownloadProgressAtom(ctx, first)
    playlistDownloadProgressAtom(ctx, second)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual(second)
  })
})

describe('setTrackDownloadProgress', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('writes progress for the given URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.5, url: 'https://example.com/1.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.5,
    })
  })

  test('overwrites the previous progress for the same URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.9, url: 'https://example.com/1.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.9,
    })
  })

  test('keeps other URLs untouched', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.8, url: 'https://example.com/2.mp3' })
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/1.mp3': 0.2,
      'https://example.com/2.mp3': 0.8,
    })
  })
})

describe('removeTrackDownloadProgress', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('removes the entry for the given URL', () => {
    setTrackDownloadProgress(ctx, { progress: 0.5, url: 'https://example.com/1.mp3' })
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('keeps other URLs untouched', () => {
    setTrackDownloadProgress(ctx, { progress: 0.2, url: 'https://example.com/1.mp3' })
    setTrackDownloadProgress(ctx, { progress: 0.8, url: 'https://example.com/2.mp3' })
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({
      'https://example.com/2.mp3': 0.8,
    })
  })

  test('is a no-op when the URL is absent (atom reference unchanged)', () => {
    const before = ctx.get(playlistDownloadProgressAtom)
    removeTrackDownloadProgress(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(playlistDownloadProgressAtom)).toBe(before)
  })
})

describe('cachedUrlsAtom registry', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('has initial value of empty object', () => {
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
  })

  test('markUrlCached records the URL', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(cachedUrlsAtom)).toEqual({ 'https://example.com/1.mp3': true })
  })

  test('markUrlCached keeps other URLs untouched', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    markUrlCached(ctx, 'https://example.com/2.mp3')
    expect(ctx.get(cachedUrlsAtom)).toEqual({
      'https://example.com/1.mp3': true,
      'https://example.com/2.mp3': true,
    })
  })

  test('markUrlCached is a no-op when the URL is already present (atom reference unchanged)', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    const before = ctx.get(cachedUrlsAtom)
    markUrlCached(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(cachedUrlsAtom)).toBe(before)
  })

  test('markUrlEvicted removes the URL', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    markUrlEvicted(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
  })

  test('markUrlEvicted keeps other URLs untouched', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    markUrlCached(ctx, 'https://example.com/2.mp3')
    markUrlEvicted(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(cachedUrlsAtom)).toEqual({ 'https://example.com/2.mp3': true })
  })

  test('markUrlEvicted is a no-op when the URL is absent (atom reference unchanged)', () => {
    const before = ctx.get(cachedUrlsAtom)
    markUrlEvicted(ctx, 'https://example.com/1.mp3')
    expect(ctx.get(cachedUrlsAtom)).toBe(before)
  })

  test('clearCachedUrls drops the whole registry', () => {
    markUrlCached(ctx, 'https://example.com/1.mp3')
    markUrlCached(ctx, 'https://example.com/2.mp3')
    clearCachedUrls(ctx)
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
  })

  test('clearCachedUrls is a no-op when already empty (atom reference unchanged)', () => {
    const before = ctx.get(cachedUrlsAtom)
    clearCachedUrls(ctx)
    expect(ctx.get(cachedUrlsAtom)).toBe(before)
  })
})

describe('offline registry sync on eviction', () => {
  let ctx: Ctx

  beforeEach(() => {
    ctx = createCtx()
  })

  test('markUrlEvicted removes the registry entry for the URL', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    markUrlEvicted(ctx, AUDIO_URL)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('markUrlEvicted keeps other registry entries untouched', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    registerOfflineSermon(ctx, OTHER_AUDIO_URL, mockSermon, mockPlaylist)
    markUrlEvicted(ctx, AUDIO_URL)
    expect(Object.keys(ctx.get(offlineRegistryAtom))).toEqual([OTHER_AUDIO_URL])
  })

  test('markUrlEvicted is a no-op for the registry when the URL is absent', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const before = ctx.get(offlineRegistryAtom)
    markUrlEvicted(ctx, OTHER_AUDIO_URL)
    expect(ctx.get(offlineRegistryAtom)).toBe(before)
  })

  test('clearCachedUrls wipes the offline registry', () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    registerOfflineSermon(ctx, OTHER_AUDIO_URL, mockSermon, mockPlaylist)
    clearCachedUrls(ctx)
    expect(ctx.get(offlineRegistryAtom)).toEqual({})
  })

  test('clearCachedUrls is a no-op for the registry when already empty', () => {
    const before = ctx.get(offlineRegistryAtom)
    clearCachedUrls(ctx)
    expect(ctx.get(offlineRegistryAtom)).toBe(before)
  })
})
